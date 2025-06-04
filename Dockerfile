FROM node:18-alpine

COPY create-agent.js /create-agent.js
RUN chmod +x create-agent.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x entrypoint.sh


ENTRYPOINT ["/entrypoint.sh"]