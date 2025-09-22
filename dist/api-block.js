(function(){
  // Docsify API Block plugin (distribution)
  function parseAttrs(attrStr){
    var out = {};
    if (!attrStr) return out;
    var re = /(\w+)\s*=\s*"([^"]*)"/g; var m;
    while ((m = re.exec(attrStr))) { out[m[1]] = m[2]; }
    return out;
  }
  function buildHTML(attrs, reqHTML, resHTML){
    var method = (attrs.method || '').toUpperCase();
    var path = attrs.path || '';
    var methodClass = method ? ('method-' + method.toLowerCase()) : '';
    var expanded = (String(attrs.expanded || attrs.open || '').toLowerCase() === 'true');
    return [
      '<details class="apiblock" data-method="'+ method +'" data-path="'+ path +'"'+ (expanded ? ' open' : '') +'>',
      '  <summary class="apiblock-header">',
      method ? '    <span class="apiblock-method '+ methodClass +'">'+ method +'</span>' : '',
      path ? '    <code class="apiblock-path">'+ path +'</code>' : '',
      '    <span class="apiblock-chevron" aria-hidden="true"></span>',
      '  </summary>',
      '  <div class="apiblock-sections">',
      '    <section class="apiblock-section">',
      '      <div class="apiblock-body">'+ reqHTML +'</div>',
      '    </section>',
      '    <section class="apiblock-section">',
      '      <div class="apiblock-title">Respuesta</div>',
      '      <div class="apiblock-body">'+ resHTML +'</div>',
      '    </section>',
      '  </div>',
      '</details>'
    ].join('\n');
  }
  function replaceApiBlocks(html){
    var re = /<!--\s*api:start([^>]*)-->([\s\S]*?)<!--\s*api:response\s*-->([\s\S]*?)<!--\s*api:end\s*-->/gi;
    return html.replace(re, function(_, attrStr, req, res){
      var attrs = parseAttrs(attrStr || '');
      return buildHTML(attrs, req.trim(), res.trim());
    });
  }
  function wireAnimations(root){
    var nodes = (root || document).querySelectorAll('details.apiblock');
    nodes.forEach(function(d){
      if (d.__apiblockWired) return;
      d.__apiblockWired = true;
      var content = d.querySelector('.apiblock-sections');
      if (!content) return;
      function setMax(opening){
        if (opening) {
          content.style.maxHeight = content.scrollHeight + 'px';
          content.style.opacity = '1';
          var done = false;
          var onEnd = function(e){
            if (done) return;
            if (!e || e.propertyName === 'max-height') {
              done = true;
              if (d.open) content.style.maxHeight = 'none';
              content.removeEventListener('transitionend', onEnd);
            }
          };
          content.addEventListener('transitionend', onEnd);
          setTimeout(function(){ onEnd(); }, 320);
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
          void content.offsetHeight; 
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
        }
      }
      if (d.open) {
        content.style.maxHeight = 'none';
        content.style.opacity = '1';
      } else {
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
      }
      d.addEventListener('toggle', function(){
        if (d.open) setMax(true); else setMax(false);
      });
    });
  }
  function plugin(hook, vm){
    hook.afterEach(function(html, next){ next(replaceApiBlocks(html)); });
    hook.doneEach(function(){ wireAnimations(document); });
  }
  if (typeof window !== 'undefined' && window.$docsify) {
    window.$docsify.plugins = [].concat(window.$docsify.plugins || [], plugin);
  }
})();
