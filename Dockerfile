FROM node:18-alpine

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x entrypoint.sh
COPY create-agent.js /create-agent.js
RUN chmod +x create-agent.js

ENTRYPOINT ["/entrypoint.sh"]