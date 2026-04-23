(function () {
  var mount = document.getElementById('mwu-universal-header');
  if (!mount) return;
  var LANGUAGE_STORAGE_KEY = 'mwu_selected_lang';
  var LANGUAGE_LABELS = {
    en: 'EN',
    am: 'AM',
    om: 'OM'
  };

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

  function getCookie(name) {
    var prefix = name + '=';
    var parts = document.cookie ? document.cookie.split('; ') : [];
    for (var i = 0; i < parts.length; i += 1) {
      if (parts[i].indexOf(prefix) === 0) {
        return decodeURIComponent(parts[i].slice(prefix.length));
      }
    }
    return '';
  }

  function setCookie(name, value, maxAgeSeconds) {
    var cookie = name + '=' + encodeURIComponent(value) + ';path=/';
    if (typeof maxAgeSeconds === 'number') {
      cookie += ';max-age=' + maxAgeSeconds;
    }
    document.cookie = cookie;
  }

  function normalizeLanguage(value) {
    var lang = (value || '').toLowerCase();
    return LANGUAGE_LABELS[lang] ? lang : 'en';
  }

  function getSavedLanguage() {
    var stored = '';
    try {
      stored = window.localStorage ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : '';
    } catch (err) {
      stored = '';
    }

    var cookie = getCookie('googtrans');
    var fromCookie = '';
    if (cookie) {
      var segments = cookie.split('/');
      if (segments.length >= 3) {
        fromCookie = segments[2];
      }
    }

    return normalizeLanguage(stored || fromCookie || 'en');
  }

  function persistLanguage(lang) {
    var normalized = normalizeLanguage(lang);
    var cookieValue = '/en/' + normalized;

    setCookie('googtrans', cookieValue, 31536000);

    try {
      if (window.localStorage) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
      }
    } catch (err) {
      // Ignore storage failures in private browsing or restricted mode.
    }

    document.documentElement.setAttribute('lang', normalized);
    return normalized;
  }

  function createChangeEvent() {
    if (typeof Event === 'function') {
      return new Event('change', { bubbles: true });
    }

    var event = document.createEvent('HTMLEvents');
    event.initEvent('change', true, false);
    return event;
  }

  function waitForTranslateSelect(timeoutMs) {
    return new Promise(function (resolve, reject) {
      var elapsed = 0;
      var interval = setInterval(function () {
        var select = document.querySelector('.goog-te-combo');
        if (select) {
          clearInterval(interval);
          resolve(select);
          return;
        }

        elapsed += 50;
        if (elapsed >= timeoutMs) {
          clearInterval(interval);
          reject(new Error('Google Translate control not found'));
        }
      }, 50);
    });
  }

  function ensureGoogleTranslateWidget() {
    var widgetHost = document.getElementById('mwu-google-translate-element');
    if (!widgetHost) {
      widgetHost = document.createElement('div');
      widgetHost.id = 'mwu-google-translate-element';
      widgetHost.style.display = 'none';
      document.body.appendChild(widgetHost);
    }

    function initWidget() {
      if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) {
        return Promise.reject(new Error('Google Translate unavailable'));
      }

      if (!window.mwuGoogleTranslateWidgetInitialized) {
        window.mwuGoogleTranslateWidgetInitialized = true;
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'mwu-google-translate-element'
        );
      }

      return waitForTranslateSelect(5000);
    }

    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      return initWidget();
    }

    return new Promise(function (resolve, reject) {
      var existingScript = document.getElementById('mwu-google-translate-script');

      if (existingScript) {
        var elapsed = 0;
        var poll = setInterval(function () {
          if (window.google && window.google.translate && window.google.translate.TranslateElement) {
            clearInterval(poll);
            initWidget().then(resolve).catch(reject);
            return;
          }

          elapsed += 50;
          if (elapsed >= 7000) {
            clearInterval(poll);
            reject(new Error('Google Translate script timed out'));
          }
        }, 50);
        return;
      }

      window.mwuGoogleTranslateReady = function () {
        initWidget().then(resolve).catch(reject);
      };

      var script = document.createElement('script');
      script.id = 'mwu-google-translate-script';
      script.async = true;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=mwuGoogleTranslateReady';
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function updateLanguageUi(switcher, language) {
    var normalized = normalizeLanguage(language);
    var current = switcher.querySelector('[data-lang-current]');
    if (current) {
      current.textContent = LANGUAGE_LABELS[normalized] || 'EN';
    }

    var links = switcher.querySelectorAll('a[data-lang]');
    Array.prototype.forEach.call(links, function (link) {
      var linkLang = normalizeLanguage(link.getAttribute('data-lang'));
      var active = linkLang === normalized;
      link.classList.toggle('active', active);
      link.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function resolveTranslateValue(select, normalized) {
    if (normalized !== 'en') return normalized;

    var hasEnglishOption = false;
    var hasDefaultOption = false;
    for (var i = 0; i < select.options.length; i += 1) {
      var optionValue = (select.options[i].value || '').toLowerCase();
      if (optionValue === 'en') hasEnglishOption = true;
      if (optionValue === '') hasDefaultOption = true;
    }

    if (hasEnglishOption) return 'en';
    if (hasDefaultOption) return '';
    return 'en';
  }

  function applyLanguage(language, options) {
    var config = options || {};
    var normalized = persistLanguage(language);

    if (normalized === 'en' && config.skipWidget) {
      return Promise.resolve();
    }

    return ensureGoogleTranslateWidget()
      .then(function (select) {
        var nextValue = resolveTranslateValue(select, normalized);
        if (select.value !== nextValue) {
          select.value = nextValue;
          select.dispatchEvent(createChangeEvent());
        }
      })
      .catch(function () {
        if (config.silent || normalized === 'en') return;

        var translatedUrl =
          'https://translate.google.com/translate?hl=en&sl=en&tl=' +
          encodeURIComponent(normalized) +
          '&u=' +
          encodeURIComponent(window.location.href);
        window.location.href = translatedUrl;
      });
  }

  function initLanguageSwitcher(root) {
    var switcher = root.querySelector('[data-language-switcher]');
    if (!switcher) return;

    var links = switcher.querySelectorAll('a[data-lang]');
    if (!links.length) return;

    var savedLanguage = getSavedLanguage();
    updateLanguageUi(switcher, savedLanguage);

    if (savedLanguage !== 'en') {
      applyLanguage(savedLanguage, { silent: true });
    } else {
      applyLanguage('en', { silent: true, skipWidget: true });
    }

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var selected = normalizeLanguage(link.getAttribute('data-lang'));
        updateLanguageUi(switcher, selected);
        applyLanguage(selected, { silent: false });
      });
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
      initLanguageSwitcher(document);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
