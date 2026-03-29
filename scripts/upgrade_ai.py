#!/usr/bin/env python3
"""
AI Template Upgrade Script

Checks for updates to the Prompt_Template repository and upgrades the local copy.
- Checks for new versions daily
- Clones the remote repository
- Overwrites local files with updated versions (upgrade_ai.py handled separately)
- Preserves template.md files if they don't exist locally

Self-update flow:
  upgrade_ai.py        → clones repo, copies all files except upgrade_ai.py,
                         stages new upgrade_ai.py to temp/, writes and launches
                         temp/self_upgrade_helper.py, then exits.
  self_upgrade_helper  → replaces scripts/upgrade_ai.py with the staged copy,
                         runs the new script with --deleteHelper.
  upgrade_ai.py        → (--deleteHelper mode) deletes temp/self_upgrade_helper.py
                         and exits.
"""

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_REMOTE_URL  = "https://github.com/goemktg/Prompt_Template.git"
_VERSION_API = "https://raw.githubusercontent.com/goemktg/Prompt_Template/main/LAST_VERSION.json"
_SCRIPT_REL  = Path("scripts") / "upgrade_ai.py"   # relative to repo root
_HELPER_NAME = "self_upgrade_helper.py"
_STAGED_NAME = "upgrade_ai_staged.py"


class TemplateUpgrader:
    """Manages template upgrades from remote repository."""

    def __init__(self, repo_root: Path, ignore_delay: bool = False):
        self.repo_root       = repo_root
        self.temp_base       = repo_root / "temp"
        self.clone_dir       = self.temp_base / "upgrade_tmp"
        self.staged_script   = self.temp_base / _STAGED_NAME
        self.helper_script   = self.temp_base / _HELPER_NAME
        self.version_file    = repo_root / "LAST_VERSION.json"
        self.state_file      = repo_root / ".copilot-memory" / "upgrade_state.json"
        self.legacy_check_file = repo_root / ".copilot-memory" / "upgrade_last_check.txt"
        self.ignore_delay    = ignore_delay

    # ------------------------------------------------------------------
    # Version / timing
    # ------------------------------------------------------------------

    def _ensure_check_dir(self):
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

    def _load_state(self) -> dict:
        self._ensure_check_dir()
        if not self.state_file.exists():
            return {"schema_version": 1}
        try:
            with open(self.state_file, encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                if "schema_version" not in data:
                    data["schema_version"] = 1
                return data
        except (OSError, json.JSONDecodeError):
            pass
        return {"schema_version": 1}

    def _save_state(self, state: dict):
        self._ensure_check_dir()
        temp_file = self.state_file.with_suffix(".json.tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, sort_keys=True)
        temp_file.replace(self.state_file)

    def _get_last_check_time(self) -> Optional[datetime]:
        state = self._load_state()
        try:
            ts = state.get("last_check_ts")
            if ts is not None:
                return datetime.fromtimestamp(float(ts))
        except (ValueError, TypeError, OSError):
            pass

        # Backward-compatibility path for existing check files.
        if self.legacy_check_file.exists():
            try:
                with open(self.legacy_check_file, encoding="utf-8") as f:
                    return datetime.fromtimestamp(float(f.read().strip()))
            except (ValueError, OSError):
                return None
        return None

    def _save_check_time(self):
        state = self._load_state()
        state["last_check_ts"] = datetime.now().timestamp()
        state["os"] = sys.platform
        interpreter = os.environ.get("UPGRADE_PYTHON_CMD")
        if interpreter:
            state["last_interpreter"] = interpreter
        self._save_state(state)

    def _save_last_exit_code(self, code: int):
        state = self._load_state()
        state["last_exit_code"] = code
        if code == 0:
            state["last_success_ts"] = datetime.now().timestamp()
        self._save_state(state)

    def _should_check_for_updates(self) -> bool:
        if self.ignore_delay:
            return True
        last = self._get_last_check_time()
        if last is None:
            return True
        elapsed = datetime.now() - last
        if elapsed < timedelta(days=1):
            print(f"Already checked for updates today ({elapsed.total_seconds() / 3600:.1f} hours ago).")
            print("Run again tomorrow or use --ignoreDelay option to force check.")
            return False
        return True

    def _get_local_version(self) -> str:
        try:
            with open(self.version_file) as f:
                return json.load(f).get("version", "unknown")
        except (FileNotFoundError, json.JSONDecodeError):
            return "unknown"

    def _fetch_remote_version(self) -> Optional[str]:
        try:
            print("Checking remote version...", end=" ")
            with urllib.request.urlopen(_VERSION_API, timeout=10) as resp:
                version = json.loads(resp.read().decode()).get("version")
                print(f"Remote version: {version}")
                return version
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as e:
            print(f"ERROR: Failed to fetch remote version: {e}")
            return None

    # ------------------------------------------------------------------
    # Clone
    # ------------------------------------------------------------------

    def _clone_repository(self) -> bool:
        print("Cloning repository...", end=" ")
        if self.clone_dir.exists():
            shutil.rmtree(self.clone_dir)
        self.clone_dir.parent.mkdir(parents=True, exist_ok=True)
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", _REMOTE_URL, str(self.clone_dir)],
                check=True,
                capture_output=True,
                timeout=60,
            )
            print("Done")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
            print(f"ERROR: Failed to clone repository: {e}")
            return False

    # ------------------------------------------------------------------
    # File copy (upgrade_ai.py excluded)
    # ------------------------------------------------------------------

    def _get_existing_templates(self) -> set:
        return {f.relative_to(self.repo_root) for f in self.repo_root.rglob("*.template.md")}

    def _get_remote_templates(self) -> set:
        return {f.relative_to(self.clone_dir) for f in self.clone_dir.rglob("*.template.md")}

    def _should_skip_file(self, rel: Path, existing_tpl: set, remote_tpl: set) -> bool:
        # upgrade_ai.py is handled separately via self-update flow
        if rel == _SCRIPT_REL:
            return True
        # template files that don't already exist locally
        if rel.name.endswith(".template.md") and rel not in existing_tpl and rel in remote_tpl:
            return True
        # preserve existing local .gitignore
        if rel == Path(".gitignore") and (self.repo_root / rel).exists():
            return True
        # skip .git metadata
        if ".git" in rel.parts:
            return True
        return False

    def _copy_files(self) -> bool:
        if not self.clone_dir.exists():
            print("ERROR: Cloned repository not found")
            return False

        existing_tpl = self._get_existing_templates()
        remote_tpl   = self._get_remote_templates()
        print("Copying files...", end=" ")
        copied = skipped = 0

        for src in self.clone_dir.rglob("*"):
            if src.is_dir():
                continue
            rel = src.relative_to(self.clone_dir)
            if self._should_skip_file(rel, existing_tpl, remote_tpl):
                skipped += 1
                continue
            dst = self.repo_root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            try:
                shutil.copy2(src, dst)
                copied += 1
            except IOError as e:
                print(f"\nWARNING: Failed to copy {rel}: {e}")

        print(f"Done ({copied} copied, {skipped} skipped)")
        return True

    # ------------------------------------------------------------------
    # Stage new upgrade_ai.py before clone cleanup
    # ------------------------------------------------------------------

    def _stage_new_script(self) -> bool:
        """Copy the new upgrade_ai.py from the clone to temp/ before cleanup."""
        cloned = self.clone_dir / _SCRIPT_REL
        if not cloned.exists():
            print("WARNING: upgrade_ai.py not found in cloned repo; skipping self-update.")
            return True  # non-fatal
        try:
            shutil.copy2(cloned, self.staged_script)
            return True
        except IOError as e:
            print(f"WARNING: Failed to stage new upgrade_ai.py: {e}")
            return False

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------

    def _cleanup_clone(self) -> bool:
        print("Cleaning up clone...", end=" ")
        try:
            if self.clone_dir.exists():
                shutil.rmtree(self.clone_dir)
            print("Done")
            return True
        except Exception as e:
            print(f"WARNING: Failed to remove clone dir: {e}")
            return False

    def _cleanup_stale_artifacts(self):
        """Remove leftover files from a previous interrupted run."""
        for path in (self.helper_script, self.staged_script):
            try:
                if path.exists():
                    path.unlink()
            except Exception:
                pass

    # ------------------------------------------------------------------
    # Self-update: write helper and launch it
    # ------------------------------------------------------------------

    def _write_helper_script(self) -> bool:
        """Write temp/self_upgrade_helper.py."""
        staged_name  = _STAGED_NAME
        script_rel   = _SCRIPT_REL.as_posix()   # 'scripts/upgrade_ai.py'

        helper_code = f"""\
#!/usr/bin/env python3
\"\"\"
Self-update helper for upgrade_ai.py.
Generated by upgrade_ai.py – do not edit manually.

Steps:
  1. Replace scripts/upgrade_ai.py with {staged_name} (staged new version).
  2. Run the new script with --deleteHelper so it removes this file.
\"\"\"
import shutil
import subprocess
import sys
from pathlib import Path


def main():
    here      = Path(__file__).parent          # temp/
    repo_root = here.parent                    # repo root
    staged    = here / {repr(staged_name)}
    target    = repo_root / {repr(script_rel)}

    if not staged.exists():
        print(f"ERROR: Staged script not found: {{staged}}")
        sys.exit(1)

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(staged, target)
    staged.unlink()
    print("upgrade_ai.py updated successfully.")

    # Ask the new script to clean up this helper file
    subprocess.run([sys.executable, str(target), "--deleteHelper"], check=True)


if __name__ == "__main__":
    main()
"""
        try:
            self.helper_script.write_text(helper_code, encoding="utf-8")
            return True
        except IOError as e:
            print(f"ERROR: Failed to write helper script: {e}")
            return False

    def _launch_helper(self) -> bool:
        """Run temp/self_upgrade_helper.py and wait for it to finish."""
        try:
            subprocess.run(
                [sys.executable, str(self.helper_script)],
                check=True,
            )
            return True
        except subprocess.CalledProcessError as e:
            print(f"WARNING: Helper exited with error code {e.returncode}")
            print(f"Manual fix: copy {self.staged_script} -> {self.repo_root / _SCRIPT_REL}")
            return True  # non-fatal
        except OSError as e:
            print(f"WARNING: Failed to launch helper: {e}")
            print(f"Manual fix: copy {self.staged_script} -> {self.repo_root / _SCRIPT_REL}")
            return True  # non-fatal

    # ------------------------------------------------------------------
    # --deleteHelper mode
    # ------------------------------------------------------------------

    def delete_helper(self):
        """Remove temp/self_upgrade_helper.py (called by the new script after self-update)."""
        if self.helper_script.exists():
            try:
                self.helper_script.unlink()
                print(f"Cleaned up {_HELPER_NAME}")
            except Exception as e:
                print(f"WARNING: Could not delete {_HELPER_NAME}: {e}")

    # ------------------------------------------------------------------
    # Main upgrade flow
    # ------------------------------------------------------------------

    def upgrade(self) -> bool:
        print("=" * 60)
        print("AI Template Upgrade Script")
        print("=" * 60)

        # Remove any leftover artifacts from a previous interrupted run
        self._cleanup_stale_artifacts()

        if not self._should_check_for_updates():
            return True

        local_version = self._get_local_version()
        print(f"Local version: {local_version}")

        remote_version = self._fetch_remote_version()
        if remote_version is None:
            print("Could not fetch remote version. Aborting upgrade.")
            return False

        self._save_check_time()

        if local_version == remote_version:
            print(f"Already up to date (version {local_version})")
            return True

        print(f"Update available: {local_version} -> {remote_version}")

        if not self._clone_repository():
            return False

        # Stage new upgrade_ai.py BEFORE cleanup so the file is still accessible
        if not self._stage_new_script():
            self._cleanup_clone()
            return False

        if not self._copy_files():
            self._cleanup_clone()
            return False

        if not self._cleanup_clone():
            return False

        # Run helper synchronously – it replaces upgrade_ai.py and cleans up
        if self.staged_script.exists():
            if not self._write_helper_script():
                return False
            self._launch_helper()

        print("=" * 60)
        print(f"Upgrade completed successfully!")
        print(f"Template updated to version {remote_version}")
        print("=" * 60)
        return True


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Upgrade AI Template from remote repository")
    parser.add_argument("--ignoreDelay",  action="store_true", help="Skip 24-hour check delay")
    parser.add_argument("--deleteHelper", action="store_true",
                        help=f"Delete {_HELPER_NAME} and exit (called automatically after self-update)")
    args = parser.parse_args()

    repo_root = Path(__file__).parent.parent

    upgrader = TemplateUpgrader(repo_root, ignore_delay=args.ignoreDelay)

    if args.deleteHelper:
        upgrader.delete_helper()
        upgrader._save_last_exit_code(0)
        sys.exit(0)

    try:
        success = upgrader.upgrade()
        upgrader._save_last_exit_code(0 if success else 1)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}", file=sys.stderr)
        upgrader._save_last_exit_code(1)
        sys.exit(1)


if __name__ == "__main__":
    main()
