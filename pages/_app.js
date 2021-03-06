import Head from 'next/head'
import Router from 'next/router'
import { Provider } from 'react-redux'

import NProgress from 'nprogress'

import { useStore } from '../store'
import Layout from '../layouts'

import '../styles/global.css'
import '../styles/tailwind.css'
import '../styles/animate.css'
import '../styles/layout.css'
import '../styles/components/navbar.css'
import '../styles/components/nprogress.css'
import '../styles/components/skeleton.css'
import '../styles/components/button.css'
import '../styles/components/dropdown.css'
import '../styles/components/table.css'
import '../styles/components/modals.css'
import '../styles/components/recharts.css'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'

Router.events.on('routeChangeStart', () => NProgress.start())
Router.events.on('routeChangeComplete', () => NProgress.done())
Router.events.on('routeChangeError', () => NProgress.done())

export default function App({ Component, pageProps }) {
  const store = useStore(pageProps.initialReduxState)

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.png" />
        <meta name="msapplication-TileColor" content="#050707" />
        <meta name="msapplication-TileImage" content="/icons/mstile-150x150.png" />
        <meta name="theme-color" content="#050707" />
        {['mainnet'].includes(process.env.NEXT_PUBLIC_NETWORK) && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  var _mtm = window._mtm = window._mtm || [];
                  _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
                  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                  g.async=true; g.src='https://cdn.matomo.cloud/connextnetwork.matomo.cloud/container_eMNAaOFI.js'; s.parentNode.insertBefore(g,s);
                `,
              }}
            />
          </>
        )}
      </Head>
      <Provider store={store}>
        <Layout>
          <div id="portal" />
          <Component {...pageProps} />
        </Layout>
      </Provider>
    </>
  )
}