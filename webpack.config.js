const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const buildFolder = `dist`;
const PORT = 3000;
const devServer = {
    port: PORT,
    // historyApiFallback: true,
    // historyApiFallback: {
    //     rewrites: [
    //       { from: /./, to: '/dist/index.html' }
    //     ]
    // },
    historyApiFallback: {
        index: `/${buildFolder}/index.html`
    },
    hot: true,
    client: {
        webSocketURL: "auto://0.0.0.0:0/ws"
    },
    compress: true,
    https: true
};
const HOST = `http${devServer.https ? "s" : ""}://localhost:${PORT}`;
const PATH = `${HOST}/${buildFolder}`;

const timestamp = new Date().getTime();

module.exports = (env, options) => {
    const isDevelopment = options.mode !== "production";

    return {
        entry: {
            index: [
                ...(isDevelopment ? [`webpack-hot-middleware/client?path=${HOST}/__webpack_hmr`] : []),
                "@babel/polyfill",
                "./src/index.js"
            ]
        },
        output: {
            path: path.join(__dirname, `/${buildFolder}`),
            clean: true,
            filename: "[name].bundle.js",
            chunkFilename: "[name].chunk.js",
            publicPath: isDevelopment ? PATH : "" // otherwise `/${buildFolder}`
        },
        devtool: "source-map",
        resolve: {
            extensions: [".js", ".jsx", "*"],
            alias: {
                "@src": path.resolve(__dirname, "src"),
                "@config": path.resolve(__dirname, "src/config"),
                "@constants": path.resolve(__dirname, "src/constants"),
                "@layouts": path.resolve(__dirname, "src/layouts"),
                "@modules": path.resolve(__dirname, "src/modules"),
                "@resources": path.resolve(__dirname, "src/resources"),
                "@services": path.resolve(__dirname, "src/services"),
                "@styles": path.resolve(__dirname, "src/styles"),
                "@utils": path.resolve(__dirname, "src/utils"),

                "@argon-ui": path.resolve(__dirname, "src/layouts/Argon-ui")
            },
            symlinks: true
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader"
                    }
                },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        // isDevelopment ? "style-loader" : MiniCssExtractPlugin.loader,
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "postcss-loader",
                        "sass-loader" // if both sass and node-sass are installed, by default dart-sass (sass) is implemented.
                    ]
                },
                {
                    test: /\.(woff|woff2|eot|ttf|svg)$/,
                    type: "asset/resource", // webpack 5 way of handling
                    ...(isDevelopment
                        ? {
                              generator: {
                                  filename: pathData => {
                                      return `/[name][ext][query]`;
                                  }
                              }
                          }
                        : {})
                    // use: [
                    //     {
                    //         loader: 'file-loader',
                    //         options: {
                    //             esModule: false, // https://stackoverflow.com/questions/59070216/webpack-file-loader-outputs-object-module
                    //             filename: '[name].[fullhash].[ext]'
                    //         }
                    //     }
                    // ]
                },
                {
                    test: /\.(jpg|jpeg)$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                esModule: false,
                                filename: "[name].[ext]"
                            }
                        }
                    ]
                },
                {
                    test: /\.(ico)$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                esModule: false,
                                limit: 1000,
                                filename: "[name].[ext]"
                            }
                        }
                    ]
                },
                {
                    test: /\.(gif|png)$/,
                    type: "asset/resource", // webpack 5 way of handling
                    ...(isDevelopment
                        ? {
                              generator: {
                                  filename: pathData => {
                                      return `/[name][ext][query]`;
                                  }
                              }
                          }
                        : {})
                    // use: [
                    //     {
                    //         loader: 'url-loader',
                    //         options: {
                    //             esModule: false,
                    //             limit: 8192,
                    //             name: '[name].[ext]'
                    //         }
                    //     }
                    // ]
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                template: "./src/index.html",
                // base: isDevelopment ? "" : env.npm_config_appbaseUrl || "",
                filename: "index.html",
                favicon: "./src/styles/amx-favicon.ico",
                excludeChunks: ["index"]
            }),
            new MiniCssExtractPlugin({
                filename: "[name].css",
                chunkFilename: "[name].css"
            }),
            new webpack.HotModuleReplacementPlugin(),
            () => {
                console.log("####################### VERSION_NO: ", env.VERSION_NO || "-");
                console.log("####################### timestamp: ", timestamp);
                try {
                    require("fs").writeFileSync(
                        path.join(__dirname, "dist/build.json"),
                        JSON.stringify({
                            timestamp: timestamp,
                            version: timestamp,
                            version_no: env ? env.VERSION_NO : "-"
                        })
                    );
                } catch (e) {
                    console.log("####################### writing to build.json failed: ", e);
                }
            }
        ],
        devServer
    };
};
