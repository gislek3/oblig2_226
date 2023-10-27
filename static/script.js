

import {render, html } from '/uhtml.js';

/**
 * Wrapper around fetch() for JSON data
 * 
 * @param {*} path The path (or URL)
 * @param {*} method Request method, defaults to GET
 * @param {*} headers Additional headers
 * @returns The response data, as an object, or null if the request failed
 */
export async function fetch_json(path, method='GET', headers = {}) {
    const resp = await fetch(path, {
        method, 
        headers:{
            accept: 'application/json',
            ...headers
        }});
    if(resp.ok) {
        return await resp.json();
    } else {
        console.error('Request failed:', resp.status, resp.statusText);
        return null;
    }
}

/**
 * Get list of users from server
 * 
 * @returns A list of simple user objects (only id and username)
 */
export async function list_users() {
    return await fetch_json('/users') || [];
}

//This code should not be here
//I was supposed to use fetch_json to retrieve it from the almost
//identical method in the User class in app.py, but ran out of time
export async function get_buddy_status(user1, user2) {
    if (user1.id == user2.id) {
        return -1; //Self
    } else if (!user1.buddies.includes(user2.id) && !user2.buddies.includes(user1.id)) {
        return 0; //No relation
    } else if (user1.buddies.includes(user2.id) && !user2.buddies.includes(user1.id)) {
        return 1; //They have a pending invite
    } else if (user2.buddies.includes(user1.id) && !user1.buddies.includes(user2.id)) {
        return 2; //You have a pending invite
    } else if (user1.buddies.includes(user2.id) && user2.buddies.includes(user1.id)) {
        return 3; //You are buddies
    } 
}

/**
 * Get a user profile from the server
 * @param {*} userid The numeric user id
 * @returns A user object
 */
export async function get_profile(userid) {
    return await fetch_json(`/users/${userid}`);
}

/**
 * Format a key-value field
 * 
 * @param {*} key The key
 * @param {*} value The value
 * @param {*} options Object with options {optional: bool, className: string, long: bool}
 * @returns HTML text
 */
export function format_field(key, value, options = {}) {
    if (options.optional && !value) {
        return html``;
    }

    let classNames = ['field'];
    if (options.className) {
        classNames.push(options.className);
    }
    if (options.long) {
        classNames.push('long');
    }

    const val = options.long ? html`<div class="value">${value || ''}</div>` : html` <span class="value">${value || ''}</span>`;

    return html`<li class=${classNames.map(cls => cls)}><span class="key">${key}</span>${val}</li>`;
}

/**
 * Display a user as a HTML element
 * 
 * @param {*} user A user object
 * @param {*} elt An optional element to render the user into
 * @returns elt or a new element
 */
export function format_profile(user, elt, buddy_status) {
    if (!elt) {
        elt = document.createElement('div');
    }
    const me = (buddy_status < 0) ? true : false;
    const buddyButton = {
        0: html`<button type="button" data-userid="${user.id}" data-action="add_buddy">Add buddy</button>`,
        1: html``,
        2: html`<button type="button" data-userid="${user.id}" data-action="add_buddy">Add buddy</button>`,
        3: html`<button type="button" data-userid="${user.id}" data-action="remove_buddy">Remove buddy</button>`
    };

    elt.classList.add('user');
    if (user.id === window.current_user_id) {
        elt.classList.add('me');
    }

    render(elt, html`
        <img src="${user.picture_url || '/unknown.png'}" alt="${user.username + "'s profile picture"}">
        <div class="data">
            ${format_field('Name', user.username)}
            <div class="more">
                ${(buddy_status >= 2) || (me) ? format_field('Birth date', user.birthdate) : ''}
                ${(buddy_status >= 2) || (me) ? format_field('Favourite colour', html`${user.color} <div class="color-sample" style="${'background:' + user.color}"></div>`): ''}
                ${(buddy_status >= 2) || (me) ? format_field('About', html`${user.about}`) : ''}
                ${buddy_status == 3 ? html`<div><br><b>You are buddies!</b></div>` : ''}
                ${buddy_status == 2 ? html`<div><br><b>They want to be your buddy!</b></div>` : ''}
                ${buddy_status == 1 ? html`<div><br><b>You have sent them a buddy request.</b></div>` : ''}
            </div>
        </div>
        <div class "controls">
            ${me ? '' : html`${buddyButton[buddy_status]}`}
        </div>
    `);

    return elt;
}






/**
 * Perform an action, such as a button click.
 * 
 * Get the action to perform and any arguments from the 'data-*' attributes on the button element.
 * 
 * @param {*} element A button element with `data-action="…"` set
 * @returns true if action was performed
 */
export async function do_action(element, current_user_id) {
    let result = false;
    if(element.dataset.action === 'add_buddy') {
        const other_user_id = parseInt(element.dataset['userid']);
        result = await fetch_json(`/add_buddy/${current_user_id}/${other_user_id}`, 'POST');
    } else if (element.dataset.action === 'remove_buddy') {
        const other_user_id = parseInt(element.dataset['userid']);
        result = await fetch_json(`/remove_buddy/${current_user_id}/${other_user_id}`, 'POST');
    }

    if (result) {
        location.reload()
        return result;
    }
    return false;
}

export async function get_buddy_list(user_id) {
    const user_info = await get_profile(user_id);
    return user_info['buddies'];
}

// demo of uhtml templates
function uhtml_demo() {
    const main = document.querySelector('main');
    function show_demo(name, template) {
        console.log(name, simple_tmpl);
        const elt = document.createElement('div');
        main.appendChild(elt);
        render(elt, html`<h3>${name}</h3>${template}`);
    }
    const unsafe_data = '<script>alert()</script>'
    // safely inserted as a string
    const simple_tmpl =  html`<em>${unsafe_data}</em>`; 
    show_demo('simple_tmpl', simple_tmpl);

    const username = "foo", nested = "nested";
    const user = html`<em>${username}</em>`
    // nested templates are inserted as HTML elements
    const message_tmpl = html`<div>Hello, my name is ${user}, and your name is ${html`<b>${nested}</b>`}</div>`
    show_demo('message_tmpl', message_tmpl)

    const users = ['alice', 'bob']
    // you can also use lists
    const users_tmpl = html`<ul>${users.map(user => html`<li>${user}</li>`)}</ul>`
    show_demo('users_tmpl', users_tmpl);

    const color = "red";
    // attributes require special care
    const attr_tmpl = html`<div class="color-sample" style="${'background:' + color}">`;
    show_demo('attr_tmpl', attr_tmpl)

    // this won't work
    const attr_tmpl_err = html`<div class="color-sample" style="background: ${color}">`;
    try {
        show_demo('attr_tmpl_err', attr_tmpl_err)
    } catch(e) {
        console.error(e);
    }

}

window.uhtml_demo = uhtml_demo;

function createElement_demo() {
    function element(tag, {cssClass, child}={}) {
        const elt = document.createElement(tag);
        if(cssClass)
            elt.className = cssClass;
        if (typeof child === 'string' || typeof child === 'number')
            elt.innerText = `${child}`;
        else if (child)
            elt.appendChild(text);
        return elt;
    }

    const fields = [{key:'Name', value:'alice'}, {key:'Favourite color', value:'pink'}]
    const outerDiv = element('div', {cssClass:'data'});
    fields.forEach(field => {
        const item = element('li', {cssClass:'field'});
        item.appendChild(element('span', {cssClass:'key', child:field.key}))
        item.appendChild(element('span', {cssClass:'value', child:field.value}))
        outerDiv.appendChild(item)
    })
    document.querySelector('main').appendChild(element('h3', {child:'createElement demo'}))
    document.querySelector('main').appendChild(outerDiv);
}
window.createElement_demo = createElement_demo;
