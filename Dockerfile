FROM docker/compose:alpine-1.27.0-rc3

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
