FROM eclipse-temurin:18-jdk-alpine

# yt-dlp is needed to download TikTok videos server-side for the smart-import feature.
# ffmpeg is required by yt-dlp to remux/merge audio+video streams for some TikTok URLs.
RUN apk add --no-cache python3 py3-pip ffmpeg \
    && pip install --break-system-packages --no-cache-dir yt-dlp

VOLUME /tmp
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
