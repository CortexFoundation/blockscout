// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'
Vue.use(VueResource);

import Router from 'vue-router'
Vue.use(Router)

import { Tabs, Tab } from 'vue-tabs-component'
import router from './router'
import App from './App'

Vue.config.productionTip = false

import { Card } from 'bootstrap-vue/es/components';
Vue.use(Card);
import { Layout } from 'bootstrap-vue/es/components';
Vue.use(Layout);
import { Table } from 'bootstrap-vue/es/components';
Vue.use(Table);
import { Button } from 'bootstrap-vue/es/components';
Vue.use(Button);
import { Dropdown } from 'bootstrap-vue/es/components';
Vue.use(Dropdown);
import { InputGroup } from 'bootstrap-vue/es/components';
Vue.use(InputGroup);
import { Progress } from 'bootstrap-vue/es/components';
Vue.use(Progress);
import { Alert } from 'bootstrap-vue/es/components';

Vue.use(Alert);

import { Form, FormInput, FormFile, FormRadio, FormTextarea, FormSelect, FormGroup } from 'bootstrap-vue/es/components';
Vue.use(Form);
Vue.use(FormInput);
Vue.use(FormFile);
Vue.use(FormRadio);
Vue.use(FormTextarea);
Vue.use(FormSelect);
Vue.use(FormGroup);


Vue.component('tabs', Tabs);
Vue.component('tab', Tab);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
