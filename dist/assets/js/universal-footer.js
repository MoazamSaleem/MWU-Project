(function () {
  var mount = document.getElementById('mwu-universal-footer');
  if (!mount) return;

  fetch('assets/partials/universal-footer.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load universal footer');
      return res.text();
    })
    .then(function (html) {
      mount.outerHTML = html;
    })
    .catch(function (err) {
      console.error(err);
    });
})();
