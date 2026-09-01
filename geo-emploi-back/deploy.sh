docker build -t geo-emploi-back .
docker run --rm \
  -p 1234:1234 \
  -v "$(pwd)/app:/app/app" \
  geo-emploi-back
