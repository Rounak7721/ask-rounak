.PHONY: dev build lint typecheck check

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

check: lint typecheck build