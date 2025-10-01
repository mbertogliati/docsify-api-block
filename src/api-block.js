(function(){
  // Docsify API Block plugin
  // Usage in Markdown (comments survive markdown->html transformation):
  // <!-- api:start method="POST" path="/redacted" -->
  // [Any markdown for the request section]
  // <!-- api:response -->
  // [Any markdown for the response section]
  // <!-- api:end -->

  function parseAttrs(attrStr){
    var out = {};
    if (!attrStr) return out;
    // naive attribute parser key="value"
    var re = /(\w+)\s*=\s*"([^"]*)"/g; var m;
    while ((m = re.exec(attrStr))) { out[m[1]] = m[2]; }
    return out;
  }

  function buildHTML(attrs, reqHTML, resHTML){
    var method = (attrs.method || '').toUpperCase();
    var path = attrs.path || '';
    var methodClass = method ? ('method-' + method.toLowerCase()) : '';
    var expanded = (String(attrs.expanded || attrs.open || '').toLowerCase() === 'true');

    var html = [
      '<details class="apiblock" data-method="'+ method +'" data-path="'+ path +'"'+ (expanded ? ' open' : '') +'>',
      '  <summary class="apiblock-header">',
      method ? '    <span class="apiblock-method '+ methodClass +'">'+ method +'</span>' : '',
      path ? '    <code class="apiblock-path">'+ path +'</code>' : '',
      '    <span class="apiblock-chevron" aria-hidden="true"></span>',
      '  </summary>',
      '  <div class="apiblock-sections">',
      '    <section class="apiblock-section">',
      '      <div class="apiblock-body">'+ reqHTML +'</div>',
      '    </section>'
    ];

    // Only add response section if resHTML is provided
    if (resHTML) {
      html.push(
        '    <section class="apiblock-section">',
        '      <div class="apiblock-title">Respuesta</div>',
        '      <div class="apiblock-body">'+ resHTML +'</div>',
        '    </section>'
      );
    }

    html.push(
      '  </div>',
      '</details>'
    );

    return html.join('\n');
  }

  function replaceApiBlocks(html){
    // Iterative parsing to handle consecutive and nested blocks correctly
    var result = '';
    var pos = 0;
    var startRe = /<!--\s*api:start([^>]*)-->/gi;
    var match;

    while ((match = startRe.exec(html)) !== null) {
      var startPos = match.index;
      var attrStr = match[1];
      var afterStart = match.index + match[0].length;
      
      // Append everything before this block
      result += html.substring(pos, startPos);
      
      // Look for api:response or api:end from afterStart position
      var responseRe = /<!--\s*api:response\s*-->/gi;
      responseRe.lastIndex = afterStart;
      var responseMatch = responseRe.exec(html);
      
      var endRe = /<!--\s*api:end\s*-->/gi;
      endRe.lastIndex = afterStart;
      var endMatch = endRe.exec(html);
      
      if (!endMatch) {
        // No end tag found, skip this malformed block
        result += match[0];
        pos = afterStart;
        continue;
      }
      
      var reqHTML, resHTML;
      
      // Check if response comes before end
      if (responseMatch && responseMatch.index < endMatch.index) {
        // Block has response section
        reqHTML = html.substring(afterStart, responseMatch.index).trim();
        resHTML = html.substring(responseMatch.index + responseMatch[0].length, endMatch.index).trim();
      } else {
        // Block has no response section
        reqHTML = html.substring(afterStart, endMatch.index).trim();
        resHTML = '';
      }
      
      // Build and append the HTML
      var attrs = parseAttrs(attrStr || '');
      result += buildHTML(attrs, reqHTML, resHTML);
      
      // Move position past the end tag
      pos = endMatch.index + endMatch[0].length;
      startRe.lastIndex = pos;
    }
    
    // Append remaining content
    result += html.substring(pos);
    
    return result;
  }

  function wireAnimations(root){
    var nodes = (root || document).querySelectorAll('details.apiblock');
    nodes.forEach(function(d){
      if (d.__apiblockWired) return;
      d.__apiblockWired = true;
      var content = d.querySelector('.apiblock-sections');
      if (!content) return;

      function setMax(opening){
        // measure then set height for animation
        if (opening) {
          content.style.maxHeight = content.scrollHeight + 'px';
          content.style.opacity = '1';
          // After transition completes, remove the max-height to allow natural growth
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
          // Fallback in case some browsers don't emit transitionend for max-height
          setTimeout(function(){ onEnd(); }, 320);
        } else {
          // For closing, set explicit height to current, force reflow, then to 0
          content.style.maxHeight = content.scrollHeight + 'px';
          // force reflow
          void content.offsetHeight; 
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
        }
      }

      // Initial state
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
    hook.afterEach(function(html, next){
      next(replaceApiBlocks(html));
    });

    hook.doneEach(function(){
      wireAnimations(document);
    });
  }

  if (typeof window !== 'undefined' && window.$docsify) {
    window.$docsify.plugins = [].concat(window.$docsify.plugins || [], plugin);
  }
})();
