<template>
  <div class="home">
    <header>
      <div class="search">
        <i class="bq-icon-home-search"></i>
        <input placeholder="请输入商品名称/条码" :value="params.parameter" @input="onChangeSearch">
      </div>
      <div class="btns">
        <scan @scan="onScan">
          <bq-button>
            <i slot="icon" class="bq-icon-home-scan"></i>
          </bq-button>
        </scan>
      </div>
    </header>
    <bq-content has-footer @scroll="resetScrollVariable" ref="content" >
      <bq-swipe :auto="5000" class="banner">
        <bq-swipe-item v-for="(item,index) in bannerList" :key="'banner'+index">
          <img class="banner-bg" :src="item.banner || 'http://ogd5wcvme.bkt.clouddn.com/no-img.png'" >
        </bq-swipe-item>
      </bq-swipe>
      <bq-tabs v-model="selectedHome" class="home-tabs">
        <bq-tab id="new" @click.native="loadGoods">
        <i class="bq-icon-home-new" slot="icon"></i>
          新品
        </bq-tab>
        <bq-tab id="selling" @click.native="loadGoods">
        <i class="bq-icon-home-selling" slot="icon"></i>
          热销
        </bq-tab>
        <bq-tab id="oftenbuy" @click.native="loadGoods">
        <i class="bq-icon-home-oftenbuy" slot="icon"></i>
          常买
        </bq-tab>
        <bq-tab id="allclassification" @click.native="goCategory">
        <i class="bq-icon-home-allclassification" slot="icon"></i>
          全部分类
        </bq-tab>
      </bq-tabs>
      <bq-good-content
        v-if="goodsList.length"
        v-infinite-scroll="loadMore"
        infinite-scroll-disabled="status.loading"
        infinite-scroll-distance="50"
        infinite-scroll-immediate-check = false>
        <bq-good-item
          class="home-goods-item"
          v-for="good in goodsList"
          :key="good.sku"
          :good="good">
        </bq-good-item>
      </bq-good-content>
      <div class="bq-f-loading" v-show="status.loading && !status.noMoreGoods">
        <bq-triple-bounce></bq-triple-bounce>
      </div>
      <p class="no-goods" v-show="status.noMoreGoods">已加载完所有商品</p>
      <p class="no-goods" v-show="status.noSearchGoods">暂未找到您要搜索的商品</p>
    </bq-content>
  </div>
</template>
<script>
import HomeService from '@/services/home.service'
import GoodService from '@/services/goods.service'
export default {
  data() {
    return {
      bannerList: [],
      selectedHome: 'new',
      params: {
        page: 1,
        pageSize: 20,
        type: 1
      },
      status: {
        loading: false,
        noMoreGoods: false
      },
      goodsList: []
    }
  },
  computed: {
    noMoreGoods () {
      return this.status.noMoreGoods && this.goodsList.length > 0
    },
    noSearchGoods() {
      return this.status.noMoreGoods && this.params.parameter && this.params.parameter.length > 0 && this.goodsList.length === 0
    }
  },
  async created() {
    this.GoodService = new GoodService()
    this.HomeService = new HomeService()
    let {bannerList} = await this.HomeService.getHomeInfo()
    this.bannerList = bannerList
  },
  mounted() {
    this.loadMore()
  },
  methods: {
    resetScrollVariable(e) {
      this.$emit('resetScrollVariable', e.target.scrollTop, this.$refs.content)
    },
    goToCart() {
      this.$router.push('/cart')
    },
    goCategory() {
      this.$router.push('/category')
    },
    async loadGoods() {
      this.params.page = 1
      this.status.loading = false
      this.status.noMoreGoods = false
      this.goodsList = []
      this.type = this.getSelType()
      this.params.parameter = null
      // 方式搜索值遗留引起的问题
      delete this.params.parameter
      this.loadMore()
    },
    async loadMore() {
      if (this.status.loading) {
        return
      }
      this.status.loading = true
      this.params.type = this.type
      if (this.$route.params.id) {
        this.params.sellerId = this.$route.params.id
      }
      let {list, next} = await this.GoodService.getCateGoodsList(this.params)
      let nList = list.map(item => {
        if (item.storeList && item.storeList.length > 0) {
          // 商品库存是否全为0
          item.good_empty = true
          // 商品为补货中状态，如果库存减去购物车数量大于等于 订货单位，是非补货状态
          item.storeList.map(sitem => {
            sitem.book = sitem.cartCount
            if (sitem.stock - sitem.cartCount * 1 >= sitem.orderUnit) {
              item.good_empty = false
            }
            return sitem
          })
        }
        return item
      })
      this.goodsList = this.goodsList.concat(nList)
      if (next === 0) {
        this.status.loading = true
        this.status.noMoreGoods = true
      } else {
        this.status.loading = false
        this.status.noMoreGoods = false
        this.params.page = this.params.page + 1
      }
    },
    getSelType() {
      switch (this.selectedHome) {
        case 'new':
          return 1
        case 'selling':
          return 2
        case 'oftenbuy':
          return 3
        case 'allclassification':
          return 4
      }
    },
    onChangeSearch(e) {
      let value = e.target.value || ''
      if (value.length > 0) {
        this.params.parameter = value
        this.goodsList = []
        this.params.page = 1
        this.status.loading = false
        this.status.noMoreGoods = false
        this.loadMore()
        return
      }
      if (value.length === 0) {
        this.params.parameter = null
        this.loadGoods()
      }
    },
    onScan(val) {
      this.params.parameter = val
      this.goodsList = []
      this.params.page = 1
      this.status.loading = false
      this.status.noMoreGoods = false
      this.loadMore()
    }
  }
}
</script>

<style lang="scss">
  @import 'scss/variables.scss';
  @import 'scss/mixin.scss';
  $iconImgUrl:'../../../assets/img';
  .home {
    width: 100%;
    height: 100%;
    overflow: hidden;
    header {
      padding: 0 20px;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 44px;
      display: flex;
      align-items: center;
      background: url(#{$iconImgUrl}/home/top-back.png) no-repeat;
      background-size: 100% 100%;
      z-index: 5;
      .search {
        flex: 1;
        height: 27px;
        position: relative;
        padding-right: 30px;
        input {
          width: 100%;
          height: 27px;
          line-height: 27px;
          border-radius: 2px;
          padding: 0;
          padding-left: 34px;
          color: #fff;
          @include font-dpr(14px);
          @include appearance(none);
          background: rgba(255,255,255, .4);
          border: none;
          font-weight: 300!important;
          letter-spacing: 2px;
          opacity: .8;
          &::-webkit-input-placeholder {
            text-indent: 0;
            color: #fff;
            @include font-dpr(14px);
            font-weight: 300!important;
            letter-spacing: 2px;
          }
        }
        i {
          position: absolute;
          top: 5px;
          left: 10px;
        }
      }
      .bq-icon-home {
        &-search {
          @include baseIcon('/home/searchwhite.png');
        }
        &-scan {
          @include baseIcon('/home/scanwhite.png', 25px, 25px) {
            top: -3px;
          };
        }
      }
      .btns {
        width: 80px;
        padding-left: 10px;
        display: flex;
        align-items: center;
        .mint-button {
          height: 27px;
          width: 35px;
          margin-left: 10px;
          background: none;
          border: none;
          padding: 0;
        }
      }

    }
    .bq-content {
      top: 0;
    }
    .banner {
      height: 200px;
      &-bg {
        width: 100%;
        height: 100%;
      }
    }
    @each $item in new, selling, oftenbuy, allclassification {
      .bq-icon-home-#{$item} {
        @include baseIcon('/home/#{$item}.png', 33px, 33px);
      }
    }
    .home-tabs {
      height: 82px;
      padding: 2px 12px 0;
      .mint-tab-item {
        padding-bottom: 0;
      }
      .mint-tab-item-icon {
        width: 33px;
        height: 33px;
      }
      .mint-tab-item-label {
        margin: 9px auto 14px;
        font-size: 12px;
        line-height: 12px;
      }
      .is-selected {
        .mint-tab-item-label {
          color: $font-color;
          font-weight: normal;
          &:after {
            bottom: -16.6px
          }
        }
      }
    }
    &-goods-item {
      .info {
        padding: 10px 37px 13px 85px;
        .detail {
          h3 {
            @include font-dpr(16px);
            line-height: 16px;
            height: 16px;
            padding: 2px 0;
          }
          h4 {
            display: inline-block;
            margin: 0;
            font-size: 14px;
            line-height: 14px;
            height: 14px;
            vertical-align: middle;
            margin-right: 30px;
          }
        }
        .img {
          width: 60px;
          height: 60px;
          left: 15px;
        }
      }
      .seller {
        padding-left: 15px;
        p {
          font-size: 14px;
          line-height: 22px;
        }
        .good-list-btn {
          .modify {
            right: 10px;
          }
        }
      }
    }
  }
</style>
