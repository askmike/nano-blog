var _gaq=[['_setAccount','UA-19313599-8'],['_trackPageview']];
(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
s.parentNode.insertBefore(g,s)}(document,'script'));

(function(doc){
  
  // add my email address
  var address = ['mi', 'ke@', 'mikevanross', 'um.nl'].join(''),
    emailElems = doc.getElementsByClassName( 'email' ),
    len = emailElems.length,
    elem;

  while( len-- ) {
    elem = emailElems[len];

    if(elem.tagName === 'A')
      elem.setAttribute( 'href', 'mailto:' + address );

    if(elem.innerHTML === '')
      elem.innerHTML = address;
  }
  
}(document));