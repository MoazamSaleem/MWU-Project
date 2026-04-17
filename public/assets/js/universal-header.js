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

  function normalizeRoute(href) {
    if (!href) return '/program';
    var clean = href.split('?')[0].split('#')[0];
    return clean.replace(/\.html$/i, '');
  }

  function initProgramSearch(root) {
    var searchBox = root.querySelector('.popup-search-box');
    if (!searchBox) return;

    var form = searchBox.querySelector('form');
    var input = searchBox.querySelector('input[type="text"]');
    if (!form || !input) return;

    var programLinks = Array.from(
      root.querySelectorAll('.mwu-mega-programs .mwu-mega-subgrid a[href$=".html"]')
    );

    var programs = programLinks.map(function (link) {
      return {
        title: (link.textContent || '').trim(),
        href: link.getAttribute('href') || ''
      };
    });

    // Enable keyboard-friendly program suggestions while typing.
    var resultList = document.createElement('ul');
    resultList.className = 'mwu-program-search-results';
    resultList.style.listStyle = 'none';
    resultList.style.margin = '8px 0 0';
    resultList.style.padding = '0';
    resultList.style.maxHeight = '220px';
    resultList.style.overflowY = 'auto';
    form.appendChild(resultList);

    function clearResults() {
      resultList.innerHTML = '';
    }

    function renderMatches(query) {
      clearResults();
      if (!query) return [];

      var q = query.toLowerCase();
      var matches = programs.filter(function (item) {
        return item.title.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);

      matches.forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = normalizeRoute(item.href);
        a.textContent = item.title;
        a.style.display = 'block';
        a.style.padding = '8px 10px';
        a.style.border = '1px solid rgba(255,255,255,0.15)';
        a.style.borderTop = '0';
        a.style.color = 'inherit';
        a.style.textDecoration = 'none';
        li.appendChild(a);
        resultList.appendChild(li);
      });

      return matches;
    }

    input.setAttribute('placeholder', 'Search MWU programs...');

    input.addEventListener('input', function () {
      renderMatches(input.value.trim());
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var query = input.value.trim();
      if (!query) {
        window.location.href = '/program';
        return;
      }

      var matches = renderMatches(query);
      if (matches.length > 0) {
        window.location.href = normalizeRoute(matches[0].href);
        return;
      }

      window.location.href = '/program';
    });

    form.addEventListener('click', function (event) {
      var link = event.target.closest('.mwu-program-search-results a');
      if (!link) return;
      event.preventDefault();
      window.location.href = link.getAttribute('href');
    });
  }

  fetch('assets/partials/inner-header.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load universal header');
      return res.text();
    })
    .then(function (html) {
      mount.outerHTML = html;
      initProgramsMegaMenu(document);
      initProgramSearch(document);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
