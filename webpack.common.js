const path = require('path');  // 路径处理模块
const webpack = require('webpack');  // 这个插件不需要安装，是基于webpack的，需要引入webpack模块
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 引入HtmlWebpackPlugin插件
const ExtractTextPlugin = require('extract-text-webpack-plugin') //引入分离插件
const resolve = dir => path.resolve(__dirname, dir);

module.exports = {
    entry: path.join(__dirname, "/src/index.jsx"), // 入口文件
    output: {
        path: path.join( __dirname, "/dist"), //打包后的文件存放的地方
        filename: "bundle.js" //打包后输出文件的文件名
    },
    module: {
        rules: [
            {
                test: /\.css$/,   // 正则匹配以.css结尾的文件
                use: ExtractTextPlugin.extract({  // 这里我们需要调用分离插件内的extract方法
                    fallback: 'style-loader',  // 相当于回滚，经postcss-loader和css-loader处理过的css最终再经过style-loader处理
                    use: ['css-loader', 'postcss-loader']
                })
            },
            {
                test: /\.(scss|sass)$/,   // 正则匹配以.scss和.sass结尾的文件
                use: ['style-loader', 'css-loader', 'sass-loader'], // 需要用的loader，一定是这个顺序，因为调用loader是从右往左编译的
            },
            {
                test: /\.(less)$/,   // 正则匹配以.scss和.sass结尾的文件
                //使用哪些加载器转换，倒序执行，也就是先使用 less-loader 刷一遍
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'less-loader', // compiles Less to CSS
                        options: {
                            lessOptions: {
                                javascriptEnabled: true
                            }
                        }
                    },
                ]
            },
            {                             // jsx配置
                test: /(\.jsx|\.js)$/,   
                use: {                    // 注意use选择如果有多项配置，可写成这种对象形式
                    loader: "babel-loader"
                }
            },
            {
                test: /\.(png|jpg|jpeg|svg|gif)$/,  // 正则匹配图片格式名
                use: [
                    {
                        loader: 'url-loader',  // 使用url-loader
                        options: {
                            limit: 10000  // 限制只有小于10kb的图片才转为base64，例子图片为1.47kb,所以不会被转化
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        alias: {
            '@': resolve('src'),
        },
        extensions:['.jsx','.js','.json']
    },
    plugins: [
        new webpack.BannerPlugin('版权所有，翻版必究'),  // new一个插件的实例 
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "/src/index.tmpl.html")// new一个这个插件的实例，并传入相关的参数
        }),
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin('style.css')
    ]
}