# 빠른 시작 가이드

5분 안에 시작하세요!

## 1. 설치 (1분)

```bash
# 저장소 클론
git clone https://github.com/<owner>/<project>.git
cd <project>

# 의존성 설치
uv sync
```

## 2. 기본 실행

### 간단한 테스트

```bash
uv run python src/experiments/<script>.py
```

**예상 출력**: [예상 출력 설명]

### SLURM으로 실행 (GPU 실험)

```bash
sbatch --job-name=test scripts/slurm/run_experiment.sh <args>
```

## 3. 테스트 실행

```bash
# 단일 테스트
uv run pytest tests/test_<module>.py

# 전체 테스트
uv run pytest tests/
```

## 4. 결과 확인

- **실험 결과**: `results/` 디렉토리
- **로그**: `logs/slurm/` 디렉토리

## 다음 단계

- [PROJECT.md](PROJECT.md) - 프로젝트 개요
- [CONTRIBUTING.md](CONTRIBUTING.md) - 기여 가이드

**Happy Hacking!** 🚀
