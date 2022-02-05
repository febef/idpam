FROM debian:latest
#MAINTAINER febef <febef.dev@gmail.com>

RUN set -x \
  && apt-get update && apt install curl -y \
  && curl -sL https://deb.nodesource.com/setup_17.x | bash - \
  && apt-get install --no-install-recommends --no-install-suggests -y -qq nodejs supervisor \
  && apt-get clean && rm -rf /tmp/*

COPY Docker/supervisor.conf /etc/supervisor/conf.d/supervisor.conf
ADD src /opt/idpam/

RUN echo "Setup Configs..." \
  && (cd /opt/idpam && npm install) \
  && chmod +x /opt/idpam/bin/idpam \
  && echo LANG="en_US.UTF-8" > /etc/default/locale

EXPOSE 80
STOPSIGNAL SIGTERM

CMD ["/usr/bin/supervisord"]
