import $ from 'jquery'
import map from 'lodash.map'
import merge from 'lodash.merge'
import URI from 'urijs'
import humps from 'humps'
import listMorph from '../lib/list_morph'
import reduceReducers from 'reduce-reducers'
import {createStore, connectElements} from '../lib/redux_helpers.js'
import '../app'

/**
 * This is a generic lib to add pagination with asynchronous page loading. There are two ways of
 * activating this in a page.
 *
 * If the page has no redux associated with, all you need is a markup with the following pattern:
 *
 *   <div data-async-load data-async-listing="firstLoadPath">
 *     <div data-loading-message> message </div>
 *     <div data-empty-response-message style="display: none;"> message </div>
 *     <div data-error-message style="display: none;"> message </div>
 *     <div data-items></div>
 *     <a data-next-page-button style="display: none;"> button text </a>
 *     <div data-loading-button style="display: none;"> loading text </div>
 *   </div>
 *
 *   the data-async-load is the attribute responsible for binding the store.
 *
 *   data-no-first-loading attribute can also be used along with data-async-load
 *   to prevent loading items for the first time
 *
 * If the page has a redux associated with, you need to connect the reducers instead of creating
 * the store using the `createStore`. For instance:
 *
 *   // my_page.js
 *   const initialState = { ... }
 *   const reducer = (state, action) => { ...  }
 *   const store = createAsyncLoadStore(reducer, initialState, 'item.Key')
 *
 * The createAsyncLoadStore function will return a store with asynchronous loading activated. This
 * approach will expect the same markup above, except for data-async-load attribute, which is used
 * to create a store and it is not necessary for this case.
 *
 */

let enableFirstLoading = true

export const asyncInitialState = {
    /* it will consider any query param in the current URI as paging */
    beyondPageOne: (URI(window.location).query() !== ''),
    /* will be sent along with { type: 'JSON' } to controller, useful for dynamically changing parameters */
    additionalParams: {},
    /* an array with every html element of the list being shown */
    items: [],
    /* the key for diffing the elements in the items array */
    itemKey: null,
    /* represents whether a request is happening or not */
    loading: false,
    /* if there was an error fetching items */
    requestError: false,
    /* if response has no items */
    emptyResponse: false,
    /* link to the current page */
    currentPagePath: null,
    /* link to the next page */
    nextPagePath: null,
    /* link to the previous page */
    prevPagePath: null,
    /* visited pages */
    pagesStack: []
}

export function asyncReducer(state = asyncInitialState, action) {
    console.log(73);
    switch (action.type) {
        case 'ELEMENTS_LOAD':
        {
            return Object.assign({}, state, {
                nextPagePath: action.nextPagePath,
                currentPagePath: action.nextPagePath
            })
        }
        case 'ADD_ITEM_KEY':
        {
            return Object.assign({}, state, {itemKey: action.itemKey})
        }
        case 'START_REQUEST':
        {
            return Object.assign({}, state, {
                loading: true,
                requestError: false,
                currentPagePath: action.path
            })
        }
        case 'REQUEST_ERROR':
        {
            return Object.assign({}, state, {requestError: true})
        }
        case 'FINISH_REQUEST':
        {
            const $element_page = $('[data-page-number]')
            console.log(362, $element_page);
            const query = window.location.search.substring(1);
            const vars = query.split("&");
            let items_count = 0;
            let page = 1;
            for (let i = 0; i < vars.length; i++) {
                let pair = vars[i].split("=");
                if (pair[0] == 'items_count') {
                    items_count = pair[1];
                }
            }
            console.log(373, items_count);
            page = parseInt(items_count / 50) + 1;
            console.log(374, page)
            for (let i = 0; i < $element_page.length; i++) {
                console.log(364, $element_page[i].innerText);
                let text = $element_page[i].innerText;
                if (text == 'Page 1') {
                    $element_page[i].innerText = 'Page ' + page
                    console.log(380, $element_page[i].innerText)
                }
            }

            return Object.assign({}, state, {
                loading: false
            })
        }
        case 'ITEMS_FETCHED':
        {
            let prevPagePath = null

            if (state.pagesStack.length >= 2) {
                prevPagePath = state.pagesStack[state.pagesStack.length - 2]
            }
            const href = window.location.href;
            const pathname = window.location.pathname;
            const search = window.location.search;
            if (state.pagesStack.length == 0 && search != '') {
                // window.sessionStorage.setItem('pagestate', JSON.stringify([href, pathname + search]))
                state.pagesStack.push(href)
                state.pagesStack.push(pathname + search)
            }

            return Object.assign({}, state, {
                requestError: false,
                emptyResponse: action.items.length === 0,
                items: action.items,
                nextPagePath: action.nextPagePath,
                prevPagePath
            })
        }
        case 'NAVIGATE_TO_OLDER':
        {
            history.replaceState({}, null, state.nextPagePath)

            if (state.pagesStack.length === 0) {
                if (window.location.pathname.includes('/search-results')) {
                    const urlParams = new URLSearchParams(window.location.search)
                    const queryParam = urlParams.get('q')
                    state.pagesStack.push(window.location.href.split('?')[0] + `?q=${queryParam}`)
                } else {
                    state.pagesStack.push(window.location.href.split('?')[0])
                }
            }

            if (state.pagesStack[state.pagesStack.length - 1] !== state.nextPagePath) {
                state.pagesStack.push(state.nextPagePath)
            }

            return Object.assign({}, state, {beyondPageOne: true})
        }
        case 'NAVIGATE_TO_NEWER':
        {
            history.replaceState({}, null, state.prevPagePath)

            state.pagesStack.pop()

            return Object.assign({}, state, {beyondPageOne: true})
        }
        default:
            return state
    }
}

export const elements = {
    '[data-async-listing]': {
        load ($el) {
            const nextPagePath = $el.data('async-listing')

            return {nextPagePath}
        }
    },
    '[data-async-listing] [data-loading-message]': {
        render ($el, state) {
            if (state.loading) return $el.show()

            $el.hide()
        }
    },
    '[data-async-listing] [data-empty-response-message]': {
        render ($el, state) {
            if (
                !state.requestError &&
                (!state.loading) &&
                state.items.length === 0
            ) {
                return $el.show()
            }

            $el.hide()
        }
    },
    '[data-async-listing] [data-error-message]': {
        render ($el, state) {
            if (state.requestError) return $el.show()

            $el.hide()
        }
    },
    '[data-async-listing] [data-items]': {
        render ($el, state, oldState) {
            if (state.items === oldState.items) return

            if (state.itemKey) {
                const container = $el[0]
                const newElements = map(state.items, (item) => $(item)[0])
                listMorph(container, newElements, {key: state.itemKey})
                return
            }

            $el.html(state.items)
        }
    },
    '[data-async-listing] [data-next-page-button]': {
        render ($el, state) {
            if (state.emptyResponse) {
                return $el.hide()
            }

            $el.show()
            if (state.requestError || !state.nextPagePath || state.loading) {
                return $el.attr('disabled', 'disabled')
            }

            $el.attr('disabled', false)
            $el.attr('href', state.nextPagePath)
        }
    },
    '[data-async-listing] [data-prev-page-button]': {
        render ($el, state) {
            if (state.emptyResponse) {
                return $el.hide()
            }

            $el.show()
            if (state.requestError || !state.prevPagePath || state.loading) {
                return $el.attr('disabled', 'disabled')
            }

            $el.attr('disabled', false)

            const urlParams = new URLSearchParams(window.location.search)
            const blockParam = urlParams.get('block_type')
            const firstPageHref = window.location.href.split('?')[0]

            if (blockParam == 'Uncle' && firstPageHref == 'https://ansible.cortexlabs.ai/blocks') {
                $el.attr('href', 'uncles')
            } else {
                $el.attr('href', state.prevPagePath)
            }
        }
    },
    '[data-async-listing] [data-first-page-button]': {
        render ($el, state) {
            if (state.pagesStack.length === 0) {
                return $el.hide()
            }

            const urlParams = new URLSearchParams(window.location.search)
            const blockParam = urlParams.get('block_type')
            const queryParam = urlParams.get('q')
            const firstPageHref = window.location.href.split('?')[0]

            $el.show()
            $el.attr('disabled', false)

            let url
            if (blockParam !== null) {
                url = firstPageHref + '?block_type=' + blockParam
            } else {
                url = firstPageHref
            }

            if (queryParam !== null) {
                url = firstPageHref + '?q=' + queryParam
            } else if (queryParam === null) {
                url = firstPageHref
            }

            if (blockParam == 'Uncle') {
                url = 'uncles'
            }

            $el.attr('href', url)
        }
    },
    '[data-async-listing] [data-page-number]': {
        render ($el, state) {
            if (state.emptyResponse) {
                return $el.hide()
            }

            $el.show()
            if (state.pagesStack.length === 0) {
                return $el.text('Page 1')
            }

            $el.text('Page ' + state.pagesStack.length)
        }
    },
    '[data-async-listing] [data-loading-button]': {
        render ($el, state) {
            if (state.loading) return $el.show()

            $el.hide()
        }
    },
    '[data-async-listing] [data-pagination-container]': {
        render ($el, state) {
            if (state.emptyResponse) {
                return $el.hide()
            }

            $el.show()
        }
    },
    '[csv-download]': {
        render ($el, state) {
            if (state.emptyResponse) {
                return $el.hide()
            }
            return $el.show()
        }
    }
}

/**
 * Create a store combining the given reducer and initial state with the async reducer.
 *
 * reducer: The reducer that will be merged with the asyncReducer to add async
 * loading capabilities to a page. Any state changes in the reducer passed will be
 * applied AFTER the asyncReducer.
 *
 * initialState: The initial state to be merged with the async state. Any state
 * values passed here will overwrite the values on asyncInitialState.
 *
 * itemKey: it will be added to the state as the key for diffing the elements and
 * adding or removing with the correct animation. Check list_morph.js for more informantion.
 */
export function createAsyncLoadStore(reducer, initialState, itemKey) {
    console.log(329);
    const state = merge(asyncInitialState, initialState)
    const store = createStore(reduceReducers(state, asyncReducer, reducer))

    if (typeof itemKey !== 'undefined') {
        store.dispatch({
            type: 'ADD_ITEM_KEY',
            itemKey
        })
    }

    connectElements({store, elements})
    firstPageLoad(store)
    return store
}

export function refreshPage(store) {
    console.log(346);
    loadPage(store, store.getState().currentPagePath)
}

export function loadPage(store, path) {
    console.log(351, path);
    store.dispatch({type: 'START_REQUEST', path})
    $.getJSON(path, merge({type: 'JSON'}, store.getState().additionalParams))
        .done(response => store.dispatch(Object.assign({type: 'ITEMS_FETCHED'}, humps.camelizeKeys(response))))
        .fail(() => store.dispatch({type: 'REQUEST_ERROR'}))
        .always(() => store.dispatch({type: 'FINISH_REQUEST'}))
}

function firstPageLoad(store) {
    console.log(360);
    const $element_page = $('[data-page-number]')
    console.log(362, $element_page);
    const query = window.location.search.substring(1);
    const vars = query.split("&");
    let items_count = 0;
    let page = 1;
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        if (pair[0] == 'items_count') {
            items_count = pair[1];
        }
    }
    console.log(373, items_count);
    page = parseInt(items_count / 50) + 1;
    console.log(374, page)
    for (let i = 0; i < $element_page.length; i++) {
        console.log(364, $element_page[i].innerText);
        let text = $element_page[i].innerText;
        if (text == 'Page 1') {
            $element_page[i].innerText = 'Page ' + page
            console.log(380, $element_page[i].innerText)
        }
    }

    const $element = $('[data-async-listing]')

    function loadItemsNext() {
        loadPage(store, store.getState().nextPagePath)
    }

    function loadItemsPrev() {
        loadPage(store, store.getState().prevPagePath)
    }

    if (enableFirstLoading) {
        loadItemsNext()
    }

    $element.on('click', '[data-error-message]', (event) => {
        event.preventDefault()
        loadItemsNext()
    })

    $element.on('click', '[data-next-page-button]', (event) => {
        event.preventDefault()
        loadItemsNext()
        store.dispatch({type: 'NAVIGATE_TO_OLDER'})
        event.stopImmediatePropagation()
    })

    $element.on('click', '[data-prev-page-button]:[href!="uncles"]', (event) => {
        event.preventDefault()
        loadItemsPrev()
        store.dispatch({type: 'NAVIGATE_TO_NEWER'})
        event.stopImmediatePropagation()
    })
    //
    // $element.on('click', '[href="uncles"]', (event) => {
    //     event.stopImmediatePropagation()
    // })
}

const $element = $('[data-async-load]')
if ($element.length) {
    if (!Object.prototype.hasOwnProperty.call($element.data(), 'noSelfCalls')) {
        if (Object.prototype.hasOwnProperty.call($element.data(), 'noFirstLoading')) {
            enableFirstLoading = false
        }
        if (enableFirstLoading) {
            const store = createStore(asyncReducer)
            connectElements({store, elements})
            firstPageLoad(store)
        }
    }
}
