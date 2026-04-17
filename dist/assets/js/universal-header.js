(function () {
  var mount = document.getElementById('mwu-universal-header');
  if (!mount) return;

  function initProgramsMegaMenu(root) {
    var mega = root.querySelector('.mwu-programs-mega');
    if (!mega) return;

    var links = mega.querySelectorAll('.mwu-mega-category-link');
    var panels = mega.querySelectorAll('.mwu-mega-panel');

    function setActive(target) {
      links.forEach(function (link) {
        var active = link.getAttribute('data-target') === target;
        link.classList.toggle('active', active);
        link.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (panel) {
        panel.classList.toggle('active', panel.getAttribute('data-panel') === target);
      });
    }

    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        setActive(link.getAttribute('data-target'));
      });
      link.addEventListener('focus', function () {
        setActive(link.getAttribute('data-target'));
      });
    });

    setActive('ug');
  }

  fetch('assets/partials/inner-header.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load universal header');
      return res.text();
    })
    .then(function (html) {
      mount.outerHTML = html;
      initProgramsMegaMenu(document);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
