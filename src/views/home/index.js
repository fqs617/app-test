const Home = resolve => require(['./src/home.vue'], resolve)
export default function (router, routes) { // routes表示底部tab
  router.push({
    path: '/',
    name: 'home',
    component: Home,
    alias: '/home',
    meta: {
      isApp: true
    }
  })
}
