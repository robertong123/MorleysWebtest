'use strict';

const searchResults = [];

// Get index from JSON file.
let fuse_config_element = document.querySelector("meta[name='ssp-config-path']");

if (null !== fuse_config_element) {
    let config_path = fuse_config_element.getAttribute("content");
    let index_url = window.location.origin + config_path + 'fuse-index.json';
    let index;

    // Multilingual?
    let language = document.documentElement.lang.substring(0, 2);
    let is_multilingual = false;

    if (document.getElementsByTagName("link").length) {
        let links = document.getElementsByTagName("link");

        for (const link of links) {
            let language_tag = link.getAttribute("hreflang");

            if ('' !== language_tag && null !== language_tag) {
                is_multilingual = true;
            }
        }
    }

    function loadIndex(callback) {
        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', index_url, false);
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }

    loadIndex(function (response) {
        let json = JSON.parse(response);
        const index = Object.values(json);

        // Build search index for Fuse.
        for (const value of index) {
            var result = {
                url: window.location.origin + value.path,
                title: value.title,
                excerpt: value.excerpt,
                content: value.content,
                language: value.language
            };

            if (is_multilingual) {
                if (result.language === language) {
                    searchResults.push(result);
                }
            } else {
                searchResults.push(result);
            }
        }
    });

// Search.
    const searchFormNode = document.querySelector('.search-form')
    const searchInputNode = document.querySelector('.search-input')
    const autoCompleteNode = document.querySelector('.search-auto-complete')
    const resultNode = document.querySelector('.result')

    let input = ''
    let results = []
    let selected = -1
    let showAutoComplete = false

    const fuse = new Fuse(
        searchResults,
        {
            keys: ['title', 'content', 'excerpt', 'language'],
            shouldSort: true,
            threshold: 0.5,
            maxPatternLength: 50
        }
    )

    function renderAutoComplete() {
        if (!showAutoComplete || input.length < 3 || results.length === 0) {
            autoCompleteNode.classList.remove('show')
            return ''
        } else {
            autoCompleteNode.classList.add('show')
        }
        return `
    <ul>
      ${results.map((result, index) => `
      <a href="${result.item.url}" style="text-decoration:none;color:#000000">
        <li class='auto-complete-item${index === selected ? ' selected' : ''}'>
          <p><b>${result.item.title}</b></br>
            <small>${result.item.excerpt}</small>
          </p>
        </li>
      </a>
    `).join('')}
    </ul>
  `
    }

    function handleSearchSubmit(event) {
        if (event) {
            event.preventDefault()
        }

        input = searchInputNode.value.trim()
        selected = -1

        document.activeElement.blur()
        autoCompleteNode.innerHTML = renderAutoComplete()

        if (input.length > 2) {
            if (results.length) {
                resultNode.innerHTML = `
                <div class="ssp-results"><h5>Searched for: <b>${input}</b></h5>
                <ul>
                  ${results.map((result, index) => `
                  <a href="${result.item.url}" style="text-decoration:none;color:#000000">
                    <li class='auto-complete-item${index === selected ? ' selected' : ''}'>
                      <p><b>${result.item.title}</b></br>
                        <small>${result.item.excerpt}</small>
                      </p>
                    </li>
                  </a>
                `).join('')}
                </ul></div>`
            } else {
                resultNode.innerHTML = `
            <div class="ssp-results">
            <h5>Searched for: <b>${input}</b></h5>
            <ul>
            <li>We couldn't find any matching results.</li>
            </ul>
            </div>`
            }
        } else {
            resultNode.innerHTML = '';
        }
    }

    function handleSearchInput(event) {
        input = event.target.value
        results = []
        if (input.length >= 3) {
            results = fuse.search(input).slice(0, 7)
        }
        showAutoComplete = true
        autoCompleteNode.innerHTML = renderAutoComplete()
    }


    function handleAutoCompleteClick(event) {
        event.stopPropagation() // Prevent click from bubbling to window click handler
        searchInputNode.value = event.target.textContent.trim()
        showAutoComplete = false
        handleSearchSubmit()
    }

    function handleWindowClick(event) {
        showAutoComplete = false
        autoCompleteNode.innerHTML = renderAutoComplete()
    }

    searchFormNode.addEventListener('submit', handleSearchSubmit)
    searchInputNode.addEventListener('input', handleSearchInput)
    autoCompleteNode.addEventListener('click', handleAutoCompleteClick)
    window.addEventListener('click', handleWindowClick)
}
