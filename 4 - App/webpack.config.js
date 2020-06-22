/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const {
  AureliaPlugin,
  ModuleDependenciesPlugin,
} = require("aurelia-webpack-plugin");
const { ProvidePlugin } = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
// const purgecss = require("@fullhuman/postcss-purgecss");
const project = require("./aurelia_project/aurelia.json");

const ensureArray = (config) =>
  (config && (Array.isArray(config) ? config : [config])) || [];
const when = (condition, config, negativeConfig) =>
  condition ? ensureArray(config) : ensureArray(negativeConfig);

const title = "Victoria Fish Classifier";
const outDir = path.resolve(__dirname, project.platform.output);
const srcDir = path.resolve(__dirname, "src");

const baseUrl = "/";

// const purgecssConfiguration = purgecss({
//   content: ["./src/**/*.html", "./src/**/*.ts"],

//   defaultExtractor: (content) => {
//     const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];

//     const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];

//     return broadMatches.concat(innerMatches);
//   },
// });

const cssRules = [
  { loader: "css-loader" },
  {
    loader: "postcss-loader",
    options: {
      plugins: () => [tailwindcss, autoprefixer(), cssnano()],
    },
  },
];

module.exports = (
  { production } = {},
  { extractCss, analyze, tests, hmr, port, host } = {}
) => ({
  resolve: {
    extensions: [".ts", ".js"],
    modules: [srcDir, "node_modules"],

    alias: {
      "aurelia-binding": path.resolve(
        __dirname,
        "node_modules/aurelia-binding"
      ),
    },
  },
  entry: {
    app: ["aurelia-bootstrapper"],
  },
  mode: production ? "production" : "development",
  output: {
    path: outDir,
    publicPath: baseUrl,
    filename: production
      ? "[name].[chunkhash].bundle.js"
      : "[name].[hash].bundle.js",
    sourceMapFilename: production
      ? "[name].[chunkhash].bundle.map"
      : "[name].[hash].bundle.map",
    chunkFilename: production
      ? "[name].[chunkhash].chunk.js"
      : "[name].[hash].chunk.js",
  },
  optimization: {
    runtimeChunk: true,

    moduleIds: "hashed",

    splitChunks: {
      hidePathInfo: true,
      chunks: "initial",

      maxInitialRequests: Infinity,
      maxAsyncRequests: Infinity,
      minSize: 10000,
      maxSize: 40000,
      cacheGroups: {
        default: false,
        vendorSplit: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `vendor.${packageName.replace("@", "")}`;
          },
          priority: 20,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          priority: 19,
          enforce: true,
        },

        vendorAsyncSplit: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `vendor.async.${packageName.replace("@", "")}`;
          },
          chunks: "async",
          priority: 10,
          reuseExistingChunk: true,
          minSize: 5000,
        },
        vendorsAsync: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors.async",
          chunks: "async",
          priority: 9,
          reuseExistingChunk: true,
          enforce: true,
        },

        commonAsync: {
          name(module) {
            const moduleName = module.context.match(/[^\\/]+(?=\/$|$)/)[0];
            return `common.async.${moduleName.replace("@", "")}`;
          },
          minChunks: 2,
          chunks: "async",
          priority: 1,
          reuseExistingChunk: true,
          minSize: 5000,
        },
        commonsAsync: {
          name: "commons.async",
          minChunks: 2,
          chunks: "async",
          priority: 0,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
  },
  performance: { hints: false },
  devServer: {
    contentBase: outDir,

    historyApiFallback: true,
    hot: hmr || project.platform.hmr,
    port: port || project.platform.port,
    host,
  },
  devtool: production ? "nosources-source-map" : "cheap-module-eval-source-map",
  module: {
    rules: [
      {
        test: /\.css$/i,
        issuer: [{ not: [{ test: /\.html$/i }] }],
        use: extractCss
          ? [
              {
                loader: MiniCssExtractPlugin.loader,
              },
              ...cssRules,
            ]
          : ["style-loader", ...cssRules],
      },
      {
        test: /\.css$/i,
        issuer: [{ test: /\.html$/i }],

        use: cssRules,
      },
      { test: /\.html$/i, loader: "html-loader" },
      { test: /\.ts$/, loader: "ts-loader" },

      {
        test: /\.(png|gif|jpg|cur)$/i,
        loader: "url-loader",
        options: { limit: 8192 },
      },
      {
        test: /\.woff2(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "application/font-woff2" },
      },
      {
        test: /\.woff(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
        loader: "url-loader",
        options: { limit: 10000, mimetype: "application/font-woff" },
      },

      {
        test: /\.(ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
        loader: "file-loader",
      },
      {
        test: /environment\.json$/i,
        use: [
          {
            loader: "app-settings-loader",
            options: { env: production ? "production" : "development" },
          },
        ],
      },
      ...when(tests, {
        test: /\.[jt]s$/i,
        loader: "istanbul-instrumenter-loader",
        include: srcDir,
        exclude: [/\.(spec|test)\.[jt]s$/i],
        enforce: "post",
        options: { esModules: true },
      }),
    ],
  },
  plugins: [
    ...when(!tests, new DuplicatePackageCheckerPlugin()),
    new AureliaPlugin(),
    new ProvidePlugin({
      Promise: ["promise-polyfill", "default"],
    }),
    new ModuleDependenciesPlugin({
      "aurelia-testing": ["./compile-spy", "./view-spy"],
    }),
    new HtmlWebpackPlugin({
      template: "index.ejs",
      minify: production
        ? {
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            minifyCSS: true,
            minifyJS: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            ignoreCustomFragments: [/\${.*?}/g],
          }
        : undefined,
      metadata: {
        title,
        baseUrl,
      },
    }),

    ...when(
      extractCss,
      new MiniCssExtractPlugin({
        filename: production
          ? "css/[name].[contenthash].bundle.css"
          : "css/[name].[hash].bundle.css",
        chunkFilename: production
          ? "css/[name].[contenthash].chunk.css"
          : "css/[name].[hash].chunk.css",
      })
    ),
    ...when(
      !tests,
      new CopyWebpackPlugin([{ from: "static", to: outDir, ignore: [".*"] }])
    ),
    ...when(analyze, new BundleAnalyzerPlugin()),
    new CleanWebpackPlugin(),
  ],
});
