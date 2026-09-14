import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={metadataBase:new URL('http://localhost:3000'),title:'10歩ダンジョン — 帰るまでが、冒険だ。',description:'足跡を残して、宝を探して。スライムに気をつけて、伝説の剣と宝物を持ち帰る、一人用の小さな冒険。',openGraph:{title:'10歩ダンジョン',description:'帰るまでが、冒険だ。足跡とスライムと伝説の剣、一人用の小さな冒険。',images:[{url:'/og.png',width:1672,height:941}],locale:'ja_JP',type:'website'},twitter:{card:'summary_large_image',title:'10歩ダンジョン',description:'帰るまでが、冒険だ。',images:['/og.png']}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ja"><body>{children}</body></html>}
