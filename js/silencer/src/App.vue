<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import bus from "./components/bus"
export default {
  name: 'App',
  data() {
    return {
      user: { name: '', key: null },
    };
  },
  created() {
    this.user = sessionStorage['cortex_current_user'] || this.user;
    bus.$on("login", (username, key) => {
      this.user.name = username;
      this.user.key = key;
    })
  }
}
</script>
