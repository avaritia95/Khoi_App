.PHONY: build run start restart stop clean virgin help

build: .env
	@docker-compose up --build --no-start

run: .env
	@docker-compose up --no-build --no-recreate || \
		(echo Failed to run containers. Did you run make first?; exit 1)

start: .env
	@docker-compose start || \
		(echo Failed to run containers. Did you run make first?; exit 1)

restart: stop start

stop: .env
	@docker-compose stop

clean: .env
	@docker-compose down -v --remove-orphans

virgin: clean
	@docker-compose down --rmi all
	@rm .env

.env:
	@envsubst < .env.dist > .env

help:
	@echo fabforce persistence service build tools:
	@echo
	@echo "	make		- Build Docker containers with dependencies"
	@echo "	make run	- Run Docker containers and dump logs to stdout"
	@echo "	make start	- Run Docker containers in the background"
	@echo "	make restart	- Restart Docker containers in the background"
	@echo "	make stop	- Stop all Docker containers"
	@echo "	make clean	- Remove all Docker containers, volumes, and orphans"
	@echo "	make virgin	- Like clean, but also remove Docker images and settings"

