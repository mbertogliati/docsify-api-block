// Test file for API block parser
// Run with: node test-parser.js

// Copy the parsing functions from api-block.js
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

// Test cases
console.log('=== TEST 1: Single block with response ===');
var test1 = `
<!-- api:start method="GET" path="/api/users" -->
Request content
<!-- api:response -->
Response content
<!-- api:end -->
`;
var result1 = replaceApiBlocks(test1);
console.log('Contains GET:', result1.includes('data-method="GET"'));
console.log('Contains /api/users:', result1.includes('/api/users'));
console.log('Contains Request content:', result1.includes('Request content'));
console.log('Contains Response content:', result1.includes('Response content'));
console.log('Contains Respuesta section:', result1.includes('apiblock-title'));
console.log('');

console.log('=== TEST 2: Single block without response ===');
var test2 = `
<!-- api:start method="DELETE" path="/api/cache" -->
Delete request only
<!-- api:end -->
`;
var result2 = replaceApiBlocks(test2);
console.log('Contains DELETE:', result2.includes('data-method="DELETE"'));
console.log('Contains /api/cache:', result2.includes('/api/cache'));
console.log('Contains Delete request only:', result2.includes('Delete request only'));
console.log('Does NOT contain Respuesta section:', !result2.includes('apiblock-title'));
console.log('');

console.log('=== TEST 3: Two consecutive blocks (both with response) ===');
var test3 = `
<!-- api:start method="GET" path="/api/users" -->
Request 1
<!-- api:response -->
Response 1
<!-- api:end -->

<!-- api:start method="POST" path="/api/orders" -->
Request 2
<!-- api:response -->
Response 2
<!-- api:end -->
`;
var result3 = replaceApiBlocks(test3);
console.log('Contains GET:', result3.includes('data-method="GET"'));
console.log('Contains POST:', result3.includes('data-method="POST"'));
console.log('Contains /api/users:', result3.includes('/api/users'));
console.log('Contains /api/orders:', result3.includes('/api/orders'));
console.log('Contains Request 1:', result3.includes('Request 1'));
console.log('Contains Response 1:', result3.includes('Response 1'));
console.log('Contains Request 2:', result3.includes('Request 2'));
console.log('Contains Response 2:', result3.includes('Response 2'));
console.log('Number of apiblock divs:', (result3.match(/class="apiblock"/g) || []).length, '(should be 2)');
console.log('');

console.log('=== TEST 4: Two consecutive blocks (mixed: with/without response) ===');
var test4 = `
<!-- api:start method="GET" path="/api/users" -->
Request 1
<!-- api:response -->
Response 1
<!-- api:end -->

<!-- api:start method="DELETE" path="/api/cache" -->
Request 2 only
<!-- api:end -->
`;
var result4 = replaceApiBlocks(test4);
console.log('Contains GET:', result4.includes('data-method="GET"'));
console.log('Contains DELETE:', result4.includes('data-method="DELETE"'));
console.log('Contains Request 1:', result4.includes('Request 1'));
console.log('Contains Response 1:', result4.includes('Response 1'));
console.log('Contains Request 2 only:', result4.includes('Request 2 only'));
console.log('Number of apiblock divs:', (result4.match(/class="apiblock"/g) || []).length, '(should be 2)');
console.log('Number of Respuesta sections:', (result4.match(/apiblock-title/g) || []).length, '(should be 1)');
console.log('');

console.log('=== TEST 5: Three consecutive blocks (no response) ===');
var test5 = `
<!-- api:start method="POST" path="/api/a" -->
A
<!-- api:end -->
<!-- api:start method="PUT" path="/api/b" -->
B
<!-- api:end -->
<!-- api:start method="PATCH" path="/api/c" -->
C
<!-- api:end -->
`;
var result5 = replaceApiBlocks(test5);
console.log('Contains POST:', result5.includes('data-method="POST"'));
console.log('Contains PUT:', result5.includes('data-method="PUT"'));
console.log('Contains PATCH:', result5.includes('data-method="PATCH"'));
console.log('Contains /api/a:', result5.includes('/api/a'));
console.log('Contains /api/b:', result5.includes('/api/b'));
console.log('Contains /api/c:', result5.includes('/api/c'));
console.log('Number of apiblock divs:', (result5.match(/class="apiblock"/g) || []).length, '(should be 3)');
console.log('Number of Respuesta sections:', (result5.match(/apiblock-title/g) || []).length, '(should be 0)');
console.log('');

console.log('=== TEST 6: Non-consecutive blocks (text in between) ===');
var test6 = `
Some text before

<!-- api:start method="GET" path="/api/first" -->
First request
<!-- api:response -->
First response
<!-- api:end -->

Some text in the middle with **markdown**

<!-- api:start method="POST" path="/api/second" -->
Second request
<!-- api:end -->

Some text after
`;
var result6 = replaceApiBlocks(test6);
console.log('Contains "Some text before":', result6.includes('Some text before'));
console.log('Contains "Some text in the middle":', result6.includes('Some text in the middle'));
console.log('Contains "Some text after":', result6.includes('Some text after'));
console.log('Contains GET:', result6.includes('data-method="GET"'));
console.log('Contains POST:', result6.includes('data-method="POST"'));
console.log('Contains First request:', result6.includes('First request'));
console.log('Contains Second request:', result6.includes('Second request'));
console.log('Number of apiblock divs:', (result6.match(/class="apiblock"/g) || []).length, '(should be 2)');
console.log('');

console.log('=== TEST 7: Malformed block (missing end tag) ===');
var test7 = `
<!-- api:start method="GET" path="/api/broken" -->
This block has no end tag

<!-- api:start method="POST" path="/api/valid" -->
Valid block
<!-- api:end -->
`;
var result7 = replaceApiBlocks(test7);
console.log('Contains original broken start tag:', result7.includes('api:start method="GET"'));
console.log('Contains POST (valid block):', result7.includes('data-method="POST"'));
console.log('Contains Valid block:', result7.includes('Valid block'));
console.log('Number of apiblock divs:', (result7.match(/class="apiblock"/g) || []).length, '(should be 1)');
console.log('');

console.log('=== TEST 8: Block with attributes (expanded) ===');
var test8 = `
<!-- api:start method="GET" path="/api/test" expanded="true" -->
Request
<!-- api:response -->
Response
<!-- api:end -->
`;
var result8 = replaceApiBlocks(test8);
console.log('Contains open attribute:', result8.includes('open'));
console.log('Contains GET:', result8.includes('data-method="GET"'));
console.log('');

console.log('=== TEST 9: Nested blocks (outer with response, inner without) ===');
var test9 = `
<!-- api:start method="GET" path="/api/outer" -->
Outer request start

<!-- api:start method="POST" path="/api/inner" -->
Inner request
<!-- api:end -->

Outer request end
<!-- api:response -->
Outer response
<!-- api:end -->
`;
var result9 = replaceApiBlocks(test9);
console.log('Contains GET (outer):', result9.includes('data-method="GET"'));
console.log('Contains POST (inner):', result9.includes('data-method="POST"'));
console.log('Contains /api/outer:', result9.includes('/api/outer'));
console.log('Contains /api/inner:', result9.includes('/api/inner'));
console.log('Number of apiblock divs:', (result9.match(/class="apiblock"/g) || []).length);
console.log('\nActual output (first 500 chars):');
console.log(result9.substring(0, 500));
console.log('...\n');

console.log('=== TEST 10: Nested blocks (both with response) ===');
var test10 = `
<!-- api:start method="GET" path="/api/outer" -->
Outer request

<!-- api:start method="POST" path="/api/inner" -->
Inner request
<!-- api:response -->
Inner response
<!-- api:end -->

<!-- api:response -->
Outer response
<!-- api:end -->
`;
var result10 = replaceApiBlocks(test10);
console.log('Contains GET (outer):', result10.includes('data-method="GET"'));
console.log('Contains POST (inner):', result10.includes('data-method="POST"'));
console.log('Number of apiblock divs:', (result10.match(/class="apiblock"/g) || []).length);
console.log('\nActual output (first 500 chars):');
console.log(result10.substring(0, 500));
console.log('...\n');

console.log('=== All tests completed ===');
