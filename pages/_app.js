import ConvexClientProvider from "./ConvexClientProvider";
 
export default function MyApp({ Component, pageProps }) {
  return (
    <ConvexClientProvider>
      <b>BFD</b>
      <Component {...pageProps} />
    </ConvexClientProvider>
  );
}