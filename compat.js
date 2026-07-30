(function () {
  var gridLayout = window.CSS && window.CSS.supports && window.CSS.supports('display', 'grid');
  var clampLayout = gridLayout && window.CSS.supports('width', 'clamp(1px, 1vw, 2px)');
  if (!gridLayout) {
    document.documentElement.className += (document.documentElement.className ? ' ' : '') + 'legacy-player';
  } else if (!clampLayout) {
    document.documentElement.className += (document.documentElement.className ? ' ' : '') + 'no-clamp';
  }
  var weatherNames = {
    0: 'Klart', 1: 'Mestadels klart', 2: 'Halvklart', 3: 'Mulet',
    45: 'Dimma', 48: 'Rimfrost-dimma', 51: 'Lätt duggregn',
    53: 'Duggregn', 55: 'Kraftigt duggregn', 61: 'Lätt regn',
    63: 'Regn', 65: 'Kraftigt regn', 71: 'Lätt snö', 73: 'Snöfall',
    75: 'Kraftigt snöfall', 80: 'Regnskurar', 81: 'Regnskurar',
    82: 'Kraftiga skurar', 95: 'Åska'
  };
  var quotes = [
    'Varje ny dag är en ny möjlighet att hitta något vackert.',
    'Ett vänligt ord kan göra en vanlig dag lite ljusare.',
    'Glädje blir större när den delas med någon annan.',
    'Små steg framåt är också framsteg.',
    'Ett leende är ett språk som alla förstår.',
    'Det är de små stunderna som gör en dag minnesvärd.',
    'Hopp är en liten låga som kan lysa långt.'
  ];
  var newsItems = [];
  var newsIndex = 0;
  var currentNameDay = '–';
  var historyItem = {
    title: 'Sommaren 1976 följde Finland de olympiska spelen i Montréal.',
    date: 'Finland 1976',
    link: 'https://svenska.yle.fi/arkivet'
  };

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { var el = byId(id); if (el) { el.textContent = value; } }
  function pad(value) { return value < 10 ? '0' + value : String(value); }

  function request(url, success, failure) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) { return; }
      if (xhr.status >= 200 && xhr.status < 300) { success(xhr.responseText); }
      else if (failure) { failure(); }
    };
    try { xhr.send(null); } catch (e) { if (failure) { failure(); } }
  }

  function showDate() {
    var now = new Date();
    var weekdays = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
    var months = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
    setText('clock', pad(now.getHours()) + '.' + pad(now.getMinutes()));
    setText('date', weekdays[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear());
  }

  function parseNameDay(html) {
    var text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    var match = text.match(/Ruotsinkieliset namn:\s*([^ ]+(?:,\s*[^ ]+)*)/i) || text.match(/Ruotsinkieliset nimet:\s*([^ ]+(?:,\s*[^ ]+)*)/i);
    if (match) { currentNameDay = match[1]; }
  }

  function loadNameDay() {
    var now = new Date();
    var url = 'https://www.nimipaivat.fi/' + now.getDate() + '.' + (now.getMonth() + 1) + '.';
    var knownSwedishNameDays = {
      '28.7': 'Håkan',
      '29.7': 'Ola, Olav, Ole, Olle och Olof',
      '30.7': 'Asta',
      '31.7': 'Helena',
      '1.8': 'Gerd och Gerda',
      '2.8': 'Holger',
      '3.8': 'Linnea och Nea'
    };
    var dateKey = now.getDate() + '.' + (now.getMonth() + 1);
    currentNameDay = knownSwedishNameDays[dateKey] || '–';
    request(url, parseNameDay, function () {
      request('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), parseNameDay, function () {});
    });
  }

  function setWeatherArt(code) {
    var panel = document.querySelector ? document.querySelector('.weather') : null;
    var art = document.querySelector ? document.querySelector('.weather-art') : null;
    var rainy = isLiquidRain(code);
    if (!panel) { return; }
    if (art) {
      if (code === 1 || code === 2) { art.src = 'forecast-partly.png'; }
      else if (code === 3) { art.src = 'forecast-cloud.png'; }
      else { art.src = 'weather-overcast.png'; }
    }
    if ((code === 1 || code === 2 || code === 3 || rainy) && panel.className.indexOf('has-illustration') === -1) {
      panel.className += ' has-illustration';
    }
    if (code !== 1 && code !== 2 && code !== 3 && !rainy) {
      panel.className = panel.className.replace(/\s*has-illustration/g, '');
    }
    if (rainy && panel.className.indexOf('has-rain') === -1) { panel.className += ' has-rain'; }
    if (!rainy) { panel.className = panel.className.replace(/\s*has-rain/g, ''); }
    setPhotoWeather(code);
  }

  function setPhotoWeather(code) {
    var photo = document.querySelector ? document.querySelector('.photo') : null;
    var type = 'weather-overcast';
    if (!photo) { return; }
    if (code === 0) { type = 'weather-sunny'; }
    else if (code === 1 || code === 2) { type = 'weather-partly'; }
    else if (code === 45 || code === 48) { type = 'weather-fog'; }
    else if ([71, 73, 75, 77, 85, 86].indexOf(code) !== -1) { type = 'weather-snow'; }
    else if ([95, 96, 99].indexOf(code) !== -1) { type = 'weather-thunder'; }
    else if (isRain(code)) { type = 'weather-rain'; }
    photo.className = photo.className.replace(/\s*weather-(sunny|partly|overcast|rain|snow|fog|thunder)/g, '');
    photo.className += ' ' + type;
  }

  function setCurrentWeatherIcon(code) {
    var icon = byId('weather-icon');
    var file = 'cloudy.png';
    if (code === 0) { file = 'clear.png'; }
    else if (code === 1 || code === 2) { file = 'partly.png'; }
    else if (code === 45 || code === 48) { file = 'fog.png'; }
    else if ([71, 73, 75, 77, 85, 86].indexOf(code) !== -1) { file = 'snow.png'; }
    else if ([95, 96, 99].indexOf(code) !== -1) { file = 'thunder.png'; }
    else if (isLiquidRain(code)) { file = 'rain.png'; }
    if (icon) { icon.innerHTML = '<img src="current-' + file + '?v=2" alt="">'; }
  }

  function loadWeather() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=60.1699&longitude=24.9384&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=Europe%2FHelsinki';
    request(url, function (response) {
      var data, current;
      try { data = JSON.parse(response); current = data.current; } catch (e) { return; }
      if (!current) { return; }
      setText('temp', Math.round(current.temperature_2m) + '°');
      setText('condition', weatherNames[current.weather_code] || 'Aktuellt väder');
      setText('wind', Math.round(current.wind_speed_10m) + ' m/s');
      setText('humidity', current.relative_humidity_2m + ' %');
      setWeatherArt(current.weather_code);
      setCurrentWeatherIcon(current.weather_code);
    }, function () {
      setText('condition', 'Väderuppgifterna är tillfälligt otillgängliga');
    });
  }

  function isRain(code) {
    return [51, 53, 55, 61, 63, 65, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].indexOf(code) !== -1;
  }

  function isLiquidRain(code) {
    return [51, 53, 55, 61, 63, 65, 80, 81, 82].indexOf(code) !== -1;
  }

  function forecastImage(code) {
    if (code === 0) { return 'forecast-sun.png'; }
    if (code === 1 || code === 2) { return 'forecast-partly.png'; }
    if (isRain(code)) { return 'forecast-cloud.png'; }
    return 'forecast-cloud.png';
  }

  function forecastKind(code) {
    if (code === 0) { return 'weather-sun'; }
    if (code === 1 || code === 2) { return 'weather-partly'; }
    if (isRain(code)) { return 'weather-rain'; }
    return 'weather-cloud';
  }

  function forecastWeekday(date) {
    var labels = ['SÖN', 'MÅN', 'TIS', 'ONS', 'TORS', 'FRE', 'LÖR'];
    return labels[date.getDay()];
  }

  function loadForecast() {
    var url = 'https://api.open-meteo.com/v1/forecast?latitude=60.1699&longitude=24.9384&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FHelsinki&forecast_days=5';
    request(url, function (response) {
      var data, daily, html = '', i, day;
      try { data = JSON.parse(response); daily = data.daily; } catch (e) { return; }
      if (!daily || !daily.time) { return; }
      for (i = 0; i < daily.time.length; i += 1) {
        day = new Date(daily.time[i] + 'T12:00:00');
        html += '<div class="forecast-day"><span class="weekday">' + forecastWeekday(day) + '</span><span class="mini-icon ' + forecastKind(daily.weather_code[i]) + '"><img src="' + forecastImage(daily.weather_code[i]) + '" alt="">' + (isRain(daily.weather_code[i]) ? '<i class="rain-drop drop-one"></i><i class="rain-drop drop-two"></i><i class="rain-drop drop-three"></i>' : '') + '</span><span class="high">' + Math.round(daily.temperature_2m_max[i]) + '°</span><span class="low">' + Math.round(daily.temperature_2m_min[i]) + '°</span></div>';
      }
      byId('forecast-days').innerHTML = html;
    }, function () {
      byId('forecast-days').innerHTML = '<div class="forecast-day">Prognosen kunde inte hämtas.</div>';
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function multilineText(value, targetLength) {
    var words = String(value).replace(/\s+/g, ' ').split(' ');
    var lines = [];
    var line = '';
    var i;
    var candidate;
    for (i = 0; i < words.length; i += 1) {
      candidate = line ? line + ' ' + words[i] : words[i];
      if (line && candidate.length > targetLength) {
        lines.push(line);
        line = words[i];
      } else {
        line = candidate;
      }
    }
    if (line) { lines.push(line); }
    return lines.join('<br>');
  }

  function setHistoryFallback() {
    var now = new Date();
    var targetYear = now.getFullYear() - 50;
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var key = targetYear + '-' + pad(month) + '-' + pad(day);
    var exactFacts = {
      '1976-07-30': {
        title: 'För exakt 50 år sedan vann Lasse Virén OS-guld på 5 000 meter i Montréal och fullbordade sin andra raka olympiska långdistansdubbel.',
        link: 'https://areena.yle.fi/1-50412746'
      },
      '1976-07-31': {
        title: 'För 50 år sedan avslutade Lasse Virén Montréal-OS med en femteplats i maraton, dagen efter guldet på 5 000 meter.',
        link: 'https://www.olympedia.org/results/61698'
      },
      '1976-08-01': {
        title: 'För 50 år sedan avslutades de olympiska spelen i Montréal. Finland hade deltagit med 83 idrottare i 14 sporter.',
        link: 'https://en.wikipedia.org/wiki/Finland_at_the_1976_Summer_Olympics'
      }
    };
    historyItem = exactFacts[key] || {
      title: 'Så såg Finland ut för 50 år sedan: Urho Kekkonen var president och sommaren präglades av semester, friidrott och de olympiska spelen i Montréal.',
      link: 'https://svenska.yle.fi/arkivet'
    };
    historyItem.date = day + '.' + month + '.' + targetYear;
  }

  function loadHistory() {
    var now = new Date();
    var targetYear = now.getFullYear() - 50;
    var url;
    setHistoryFallback();
    url = 'https://sv.wikipedia.org/api/rest_v1/feed/onthisday/all/' + pad(now.getMonth() + 1) + '/' + pad(now.getDate());
    request(url, function (response) {
      var data;
      var groups;
      var i;
      var j;
      var entry;
      var searchable;
      var page;
      try { data = JSON.parse(response); } catch (ignore) { return; }
      groups = [data.events || [], data.births || [], data.deaths || []];
      for (i = 0; i < groups.length; i += 1) {
        for (j = 0; j < groups[i].length; j += 1) {
          entry = groups[i][j];
          searchable = String(entry.text || '');
          if (entry.pages && entry.pages.length) {
            searchable += ' ' + String(entry.pages[0].title || '');
            searchable += ' ' + String(entry.pages[0].extract || '');
          }
          if (entry.year === targetYear && /Finland|finländ|finsk|Helsingfors|Helsinki|Suomi|Lasse Vir[eé]n/i.test(searchable)) {
            historyItem.title = entry.text;
            page = entry.pages && entry.pages[0];
            if (page && page.content_urls && page.content_urls.desktop) {
              historyItem.link = page.content_urls.desktop.page;
            }
            return;
          }
        }
      }
    }, function () {});
  }

  function showNextNews() {
    var box = byId('headlines');
    var panel = document.querySelector ? document.querySelector('.news') : null;
    var quote;
    var item;
    if (!newsItems.length || !box || !panel) { return; }
    if (newsIndex === newsItems.length) {
      quote = quotes[Math.floor(new Date().getTime() / 86400000) % quotes.length];
      panel.className = panel.className.replace(/\s*(nameday-slide|history-slide)/g, '');
      if (panel.className.indexOf('quote-slide') === -1) { panel.className += ' quote-slide'; }
      setText('news-source', 'Dagens citat');
      setText('news-section', 'En liten tanke för dagen');
      box.innerHTML = '<div class="headline quote">“' + multilineText(escapeHtml(quote), 38) + '”</div>';
      newsIndex += 1;
      return;
    }
    if (newsIndex === newsItems.length + 1) {
      if (panel.className.indexOf('quote-slide') === -1) { panel.className += ' quote-slide'; }
      if (panel.className.indexOf('nameday-slide') === -1) { panel.className += ' nameday-slide'; }
      panel.className = panel.className.replace(/\s*history-slide/g, '');
      setText('news-source', 'Dagens namnsdag');
      setText('news-section', 'I dag firar vi');
      box.innerHTML = '<div class="headline">' + escapeHtml(currentNameDay) + '</div>';
      newsIndex += 1;
      return;
    }
    if (newsIndex === newsItems.length + 2) {
      panel.className = panel.className.replace(/\s*(quote-slide|nameday-slide)/g, '');
      if (panel.className.indexOf('history-slide') === -1) { panel.className += ' history-slide'; }
      setText('news-source', 'Finland för 50 år sedan');
      setText('news-section', historyItem.date);
      box.innerHTML = '<div class="headline long-headline"><a href="' + escapeHtml(historyItem.link) + '" target="_blank">' + multilineText(escapeHtml(historyItem.title), 38) + '</a></div>';
      newsIndex = 0;
      return;
    }
    panel.className = panel.className.replace(/\s*(quote-slide|nameday-slide|history-slide)/g, '');
    item = newsItems[newsIndex];
    setText('news-source', 'Yle');
    setText('news-section', 'Senaste nyheterna');
    var lengthClass = item.title.length > 120 ? ' very-long-headline' : (item.title.length > 80 ? ' long-headline' : '');
    box.innerHTML = '<div class="headline' + lengthClass + '"><a href="' + item.link + '" target="_blank">' + multilineText(item.title, 36) + '</a></div>';
    newsIndex += 1;
  }

  function parseNews(xmlText) {
    var xml, items, i, title, link;
    try { xml = new DOMParser().parseFromString(xmlText, 'text/xml'); items = xml.getElementsByTagName('item'); } catch (e) { return false; }
    newsItems = [];
    for (i = 0; i < items.length && i < 3; i += 1) {
      title = items[i].getElementsByTagName('title')[0];
      link = items[i].getElementsByTagName('link')[0];
      if (title && link) {
        newsItems.push({ title: escapeHtml(title.textContent || title.text || ''), link: escapeHtml(link.textContent || link.text || 'https://svenska.yle.fi') });
      }
    }
    if (newsItems.length) { rememberNews(); newsIndex = 0; showNextNews(); return true; }
    return false;
  }

  function parseNewsJson(jsonText) {
    var data, items, i;
    try { data = JSON.parse(jsonText); items = data.items; } catch (e) { return false; }
    if (!items || !items.length) { return false; }
    newsItems = [];
    for (i = 0; i < items.length && i < 3; i += 1) {
      newsItems.push({
        title: escapeHtml(items[i].title || ''),
        link: escapeHtml(items[i].link || 'https://svenska.yle.fi')
      });
    }
    if (!newsItems.length) { return false; }
    rememberNews();
    newsIndex = 0;
    showNextNews();
    return true;
  }

  function rememberNews() {
    try { window.localStorage.setItem('silviahemmetYleNews', JSON.stringify(newsItems)); } catch (ignore) {}
  }

  function showCachedNews() {
    var cached;
    try { cached = JSON.parse(window.localStorage.getItem('silviahemmetYleNews') || '[]'); } catch (e) { cached = []; }
    if (!cached || !cached.length) { return false; }
    newsItems = cached;
    newsIndex = 0;
    showNextNews();
    return true;
  }

  function showNewsError() {
    var box, panel, quote;
    if (showCachedNews()) { return; }
    newsItems = [{ title: 'Nyheterna uppdateras i bakgrunden', link: 'https://svenska.yle.fi' }];
    newsIndex = 0;
    box = byId('headlines');
    panel = document.querySelector ? document.querySelector('.news') : null;
    quote = quotes[Math.floor(new Date().getTime() / 86400000) % quotes.length];
    if (panel && panel.className.indexOf('quote-slide') === -1) { panel.className += ' quote-slide'; }
    setText('news-source', 'Dagens citat');
    setText('news-section', 'Nyheterna uppdateras i bakgrunden');
    box.innerHTML = '<div class="headline quote">“' + multilineText(escapeHtml(quote), 38) + '”</div>';
  }

  function loadNewsJsonp(feed) {
    var callbackName = 'yleFeed' + new Date().getTime();
    var script = document.createElement('script');
    var head = document.getElementsByTagName('head')[0] || document.body;
    var done = false;
    function cleanUp() {
      if (done) { return; }
      done = true;
      if (script.parentNode) { script.parentNode.removeChild(script); }
      try { window[callbackName] = null; } catch (ignore) {}
    }
    window[callbackName] = function (data) {
      cleanUp();
      if (!data || !data.contents || !parseNews(data.contents)) { showNewsError(); }
    };
    script.onerror = function () { cleanUp(); showNewsError(); };
    script.src = 'https://api.allorigins.win/get?callback=' + callbackName + '&disableCache=true&url=' + encodeURIComponent(feed);
    head.appendChild(script);
    window.setTimeout(function () { if (!done) { cleanUp(); showNewsError(); } }, 15000);
  }

  function loadNewsViaProxy(feed) {
    request('https://api.allorigins.win/raw?url=' + encodeURIComponent(feed), function (response) {
      if (!parseNews(response)) { loadNewsJsonp(feed); }
    }, function () { loadNewsJsonp(feed); });
  }

  function loadNewsViaJson(feed) {
    var url = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(feed);
    request(url, function (response) {
      if (!parseNewsJson(response)) { loadNewsViaProxy(feed); }
    }, function () { loadNewsViaProxy(feed); });
  }

  function loadNews() {
    var feed = 'https://svenska.yle.fi/rss/senaste-nytt';
    request(feed, function (response) {
      if (!parseNews(response)) { loadNewsViaJson(feed); }
    }, function () { loadNewsViaJson(feed); });
  }

  showDate();
  loadNameDay();
  loadHistory();
  loadWeather();
  loadForecast();
  loadNews();
  window.setInterval(showDate, 30000);
  window.setInterval(loadWeather, 600000);
  window.setInterval(loadForecast, 1800000);
  window.setInterval(loadNews, 600000);
  window.setInterval(showNextNews, 15000);
  window.setInterval(loadNameDay, 21600000);
  window.setInterval(loadHistory, 21600000);
  window.setInterval(function () { window.location.reload(true); }, 3600000);
}());
