// CloudFront Function (viewer request): maps clean URLs to the files a Next.js static export
// writes with `trailingSlash: true`. /dashboard and /dashboard/ → /dashboard/index.html;
// paths with an extension (/logo.svg) pass through.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.split('/').pop().includes('.')) {
    request.uri += '/index.html';
  }
  return request;
}
