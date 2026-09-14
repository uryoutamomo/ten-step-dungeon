import {build,transform} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'release');
await mkdir(out,{recursive:true});
const art='data:image/png;base64,'+(await readFile(path.join(root,'public/og.png'))).toString('base64');
const bundle=await build({stdin:{contents:'import React from "react";import{createRoot}from"react-dom/client";import Home from"./app/page";createRoot(document.getElementById("root")).render(React.createElement(Home));',resolveDir:root,loader:'tsx'},bundle:true,write:false,minify:true,format:'iife',platform:'browser',target:['safari15','chrome100','firefox100'],define:{'process.env.NODE_ENV':'"production"'},jsx:'automatic'});
if(bundle.outputFiles[0].text.split('"/og.png"').length!==2)throw new Error('Expected exactly one illustration URL to embed');
let js=bundle.outputFiles[0].text.replaceAll('"/og.png"',JSON.stringify(art));
// Relative assets are embedded; opening this file needs no server or network.
js=js.replace(/<\/script/gi,'<\\/script');
let css=(await readFile(path.join(root,'app/globals.css'),'utf8')).replace("@import 'tailwindcss';",'');
css=(await transform(css,{loader:'css',minify:true})).code;
const html='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>10歩ダンジョン — 帰るまでが、冒険だ。</title><meta name="description" content="足跡、スライム、伝説の剣。一人用の小さな冒険。"><style>'+css+'</style></head><body><div id="root"></div><script>'+js+'</script></body></html>';
await writeFile(path.join(out,'10歩ダンジョン.html'),html);
await writeFile(path.join(out,'はじめに.txt'),'10歩ダンジョン — 帰るまでが、冒険だ。\n\n「10歩ダンジョン.html」をChrome、Safari、Firefoxなどのブラウザーで開いてください。インターネット接続やインストールは不要です。\n\n遊びかたはゲーム右上から確認できます。カードをクリック・タップ、または矢印キーで移動します。剣を抜き、ボスの宝を取り、入口へ戻るとクリアです。\n\n設定から難易度、体力、灯り、スライムの数などを変えられます。途中経過は、このゲーム専用のブラウザー保存領域に保存します。ブラウザーの設定やHTMLファイルの開き方により、保存できないことがあります。\n\n写真と説明をもとにした一人用アレンジで、原作の厳密なルール再現ではありません。イラストは本作向けに生成、ゲーム内のコマはCSSで描画しています。外部イラスト素材や原作写真は同梱していません。\n\n制作: おと（Codex）\n');
console.log(`Offline game exported: ${path.join(out,'10歩ダンジョン.html')} (${Math.round(Buffer.byteLength(html)/1024)} KB)`);
