FROM node:20-alpine as dist-build
RUN mkdir -p /dist-build && chown -R node:node /dist-build
WORKDIR /dist-build
USER node
ARG ENV=prod
COPY package.json /dist-build/package.json
RUN npm install
COPY ./ /dist-build
RUN npm run build-${ENV} && \
    rm -rf node_modules

FROM httpd:alpine
# https://blog.neoprime.it/ng-in-httpd/

ENV BACKEND_HOST=backend \
    BACKEND_PORT=8081 \
    SERVER_NAME=localhost

# Install curl, just for healthchecking, without using local cache for the package lists
RUN apk --no-cache add curl

# Define a healthcheck that tests the root URL of the site
HEALTHCHECK --interval=5s --timeout=3s CMD curl --fail http://localhost:80/ || exit 1

# Remove any files that may be in the public htdocs directory already.
RUN rm -r /usr/local/apache2/htdocs/*

# # Enable the rewrite module in apache2.
# RUN sed -i \
#   's/#LoadModule rewrite_module modules\/mod_rewrite.so/LoadModule rewrite_module modules\/mod_rewrite.so/g' \
#   /usr/local/apache2/conf/httpd.conf

# # Append to the published directory, that we want to rewrite any request that is not an actual file
# # to the index.html page.
# RUN sed -i '/<Directory "\/usr\/local\/apache2\/htdocs\">/a### Rewrite rule was written from the Dockerfile when building the image ###\n\
#     DirectoryIndex index.html\n\
#     RewriteEngine on\n\
#     RewriteCond %{REQUEST_FILENAME} -s [OR]\n\
#     RewriteCond %{REQUEST_FILENAME} -d\n\
#     RewriteRule ^.*$ - [NC,L]\n\
#     RewriteRule ^(.*) index.html [NC,L]\n' \
#   /usr/local/apache2/conf/httpd.conf

# # Comment out the default config that handles requests to /.htaccess and /.ht* with a special error message,
# # Angular will handle all routing
# RUN sed -i '/<Files "\.ht\*">/,/<\/Files>/c# This was commented out from the Dockerfile\n# <Files ".ht*">\n#     Require all denied\n# <\/Files>' \
#   /usr/local/apache2/conf/httpd.conf

# Copy all the files from the docker build context into the public htdocs of the apache container.
COPY --from=dist-build /dist-build/dist/foodbank-it-client/ /usr/local/apache2/htdocs/
COPY --from=dist-build /dist-build/docker/httpd-vhosts.conf /usr/local/apache2/conf/extra
COPY --from=dist-build /dist-build/docker/httpd.conf /usr/local/apache2/conf/
RUN echo goe2mwwuknb2z4kfupd60btlsd5vi24dqvxh2wn-fhrqlzyf9pzi8rgjhilsuxfnplhwr2m4mlth56dm7-a666xu026l7ya97meoyur7ub1ixh3rxemgss3lyvv34tqh > /usr/local/apache2/htdocs/nortonsw_064ba940-f785-0.html

# Change owner of the publicly available files to root user and daemon group. Httpd threads run as daemon.
RUN chown -R root:daemon \
  /usr/local/apache2/htdocs/*

# Ensure that the files can only be read, even by the httpd server.
RUN chmod -R 440 \
  /usr/local/apache2/htdocs/*

# Ensure for all the directories created, that the files within them can be read. We need the
# execution access privilege on the directory for this. Dynamically apply this to all directories
# at least one level into the served root. (-mindepth 1, otherwise the served directory itself
# would be included - no need for that.
RUN find /usr/local/apache2/htdocs/ -mindepth 1 -type d -exec chmod +x {} \;

RUN apk --no-cache add openssl
RUN mkdir -p /home/letsencrypt/certs/live/localhost && \
    openssl req -x509 -sha256 -nodes -newkey rsa:2048 -days 365 \
               -subj "/C=BE/ST=BE/L=Brussels/O=FoodBank/OU=IT/CN=localhost" \
               -keyout /home/letsencrypt/certs/live/localhost/privkey.pem \
               -out /home/letsencrypt/certs/live/localhost/cert.pem