FROM node:18.0

RUN apt-get update && \
    apt-get install -y jq curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY create-agent.js /create-agent.js
RUN chmod +x create-agent.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]