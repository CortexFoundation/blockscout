import $ from 'jquery'
console.log(1);

$('button[data-loading="animation"]').click(_event => {
  $('#loading').removeClass('d-none')
})
