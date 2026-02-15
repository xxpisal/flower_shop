FROM postgres:16-alpine
COPY init.sql /docker-entrypoint-initdb.d/

ENV POSTGRES_DB=flowerdb
ENV POSTGRES_USER=floweruser
ENV POSTGRES_PASSWORD=flowerpass

EXPOSE 5432
