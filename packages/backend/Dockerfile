FROM node:20-slim

WORKDIR /app

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/dist/ packages/shared/dist/

# Copy backend package
COPY packages/backend/package.json packages/backend/
COPY packages/backend/dist/ packages/backend/dist/

# Rewrite workspace:* to file: reference for standalone install
WORKDIR /app/packages/backend
RUN node -e "\
  const pkg = require('./package.json');\
  pkg.dependencies['@milionerzy/shared'] = 'file:../shared';\
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

RUN npm install --omit=dev

EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/index.js"]
