import ConvexClientProvider from "./ConvexClientProvider";
 
export default function MyApp({ Component, pageProps }) {
  return (
    <ConvexClientProvider>
      <Component {...pageProps} />
    </ConvexClientProvider>
  );
}