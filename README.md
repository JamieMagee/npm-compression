# npm-compression

A web application that demonstrates and analyzes different compression algorithms for npm packages. This tool allows you to search for npm packages and compare the compression ratios and potential bandwidth savings of gzip, Brotli, and ZStandard (zstd) compression algorithms.

View the live demo at https://jamiemagee.github.io/npm-compression/

## 🎯 What is this?

This project is a practical demonstration of the concepts explored in my blog post ["Honey, I shrunk the npm package"](https://jamiemagee.co.uk/blog/honey-i-shrunk-the-npm-package/). It provides an interactive way to:

- Search for any npm package
- Download and analyze the package's tarball
- Compare compression ratios across different algorithms
- Visualize potential bandwidth savings
- Understand the real-world impact of modern compression on the npm ecosystem

## 🗜️ Compression Algorithms Explained

### gzip
**gzip** (GNU zip) is the current standard compression format used by npm. Developed in the early 1990s, it's based on the DEFLATE algorithm and has been the backbone of web compression for decades. While reliable and universally supported, gzip is starting to show its age compared to more modern alternatives.

### Brotli
**Brotli** is a compression algorithm developed by Google and released in 2013. It's standardized in [RFC 7932](https://datatracker.ietf.org/doc/html/rfc7932) and has been built into Node.js since version 10.16.0. Brotli typically achieves better compression ratios than gzip, especially at higher quality levels.

### ZStandard (zstd)
**ZStandard** (zstd) is a compression algorithm developed by Facebook and released in 2016. It's standardized in [RFC 8478](https://datatracker.ietf.org/doc/html/rfc8478) and focuses on "real-time compression" with excellent decompression speeds. Many projects have adopted zstd for package distribution.


## 📄 License

This project is open source and available under the MIT License.

## 🔗 Related Links

- [Original Blog Post](https://jamiemagee.co.uk/blog/honey-i-shrunk-the-npm-package/)
- [npm RFC for Brotli/Zopfli Support](https://github.com/npm/rfcs/pull/595)
- [Brotli RFC 7932](https://datatracker.ietf.org/doc/html/rfc7932)
- [ZStandard RFC 8478](https://datatracker.ietf.org/doc/html/rfc8478)