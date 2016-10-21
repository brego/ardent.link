---
title:       Growing your textarea
subtitle:    Make your textareas grow automatically with their content
description: Get your textareas to grow in height to suit their content.
keywords:    textarea, autogrow, autosizing
---

Recently I've spent quiet a lot of time figuring out how to make my textareas
grow in height to suit their content. I've waded through a whole bunch of
plugins and ideas -- ranging from great to outrageously bad ones -- and lack of
articles on the subject made me write this, in hopes that someday it'll help
somebody else.

### Intro

Let's note that I was in need of a JavaScript solution, because of an unrelated
back-end issue. However, you can create autosizing textareas with CSS using an
element with the `contenteditable` attribute.

The solution is described on [Stack Overflow here][contenteditable] -- just
please, read up on the potential pitfalls of `contenteditable`, like pasted
formatting etc.

Also, if you are just searching for a plug-and-play script that doesn't suck,
after I came up with my solution, I found [Stretchy][] by the brilliant [Lea
Verou][]. Check it out.

### A word of warning

The internet is full of bad solutions for this problem. I won't name any names,
but top searches reveal a staggering amount of code that really does not work
well, or at all.

Especially most of the existing jQuery plugins seem to suffer from this growing
sickness (ba-dum-tsss).

### Final vanilla solution

After testing a lot of published code, and not having much fun or success at all
really, I decided to take a stab at the problem myself. The most promising
solution, and the one I stole most from, was [Textarea-Autogrow][] by [Evyatar
Rosner][].

Here's what I came up with:

```js
function autogrow(el) {
    var style  = window.getComputedStyle(el);
    var offset = 0;
    var empty  = false;

    if (!el.value && el.placeholder) {
        empty    = true;
        el.value = el.placeholder;
    }

    el.style.height = '0';

    if (style.boxSizing == 'border-box') {
        offset = el.offsetHeight;
    } else if (style.boxSizing == 'content-box') {
        offset = -el.clientHeight;
    }

    el.style.height = el.scrollHeight + offset + 'px';

    if (empty) {
        el.value = '';
    }
}
```

Basically, the function fetches the current style of the element, to figure out
the offset (based on the `box-sizing`). That offset and the built in
`scrollHeight` property is then used to set the `height` on the element. It
works in all modern browsers, is vanilla JavaScript, does not involve fake
elements -- or other weird "magic" you'll find in the code that's out there.

Obviously I run this method in an event callback, and in my scenario also on the
initial page load. Here's how I use it on a page with jQuery, where `$body` is a
jQuery object reffering to the `<body>` element:

```js
$body.on('input', 'textarea', function() {
    autogrow(this);
});
```

### Post-mortem

As genius as I thought I was coming up with my very own version of this
particular wheel, I have to mention again that afterwards I did find
[Stretchy][], which basically uses the same approach, and is better in most
ways. Kudos to [Lea Verou][].

I hope this helps you -- but don't hesitate to [hit me up][] if you've got any
questions or better ideas on the subject.


[contenteditable]:   http://stackoverflow.com/a/15866077/954798
[Lea Verou]:         http://lea.verou.me/
[Stretchy]:          http://leaverou.github.io/stretchy/
[Textarea-Autogrow]: https://github.com/CodingAspect/Textarea-Autogrow
[Evyatar Rosner]:    http://www.codingaspect.com/
[hit me up]:         /about/
