[![License: AGPL v3](https://img.shields.io/github/license/tstibbs/pdf-viewer-sync?color=blue)](LICENSE)
[![Build Status](https://github.com/tstibbs/pdf-viewer-sync/workflows/CI/badge.svg)](https://github.com/tstibbs/pdf-viewer-sync/actions?query=workflow%3ACI)
[![GitHub issues](https://img.shields.io/github/issues/tstibbs/pdf-viewer-sync.svg)](https://github.com/tstibbs/pdf-viewer-sync/issues)

# What is this?

This project is an attempt to provide a pdf viewer for mobile devices that syncs page changes across multiple devices. This could be used for many different things, but the main use-case that inspired this project is the situation where you are attempting to play pdf sheet music. It is generally desirable to be able to see multiple pages of music at the same time, as it is often not convenient to turn the page at the point in the music that just happens to be at the bottom of each page. Using this project, you are able to bring up a pdf viewer on multiple devices, showing the same pdf, and when you change page on one device the other devices will also change page. The tool also allows you to open a pdf on one device and have it sync across (via cloud storage) to another device.

# How to use

## Deploy the backend stack in to AWS

Deploying the backend requires an AWS account which has been bootstrapped using CDK (https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) and has suitable permissions to enable use of CDK from the command line. It is in theory possible to generate the cloudformation template from CDK and then deploy 'manually' if preferred, but that is not discussed here.

In the `backend` directory:

1. Create a `.env` file using `dummy.env` as a template.
1. Fill out the values as appropriate.
1. Run `npm ci`
1. Run `npx cdk deploy` (having configured authentication as appropriate for your environment).
1. Note the value of the `endpointUrl` output printed after the deploy completes successfully.

## Load the UI

The following instructions assume that you are using the pre-deployed version of the project hosted on github pages. Note that this may be sporadically updated and may not be backwards compatible with a specific version of the backend. It should be possible to deploy the UI elsewhere however CORS settings on the backend would need to be updated to allow this.

Note in the following instructions `<endpointUrl>` should be replaced by a URL-encoded version of the `endpointUrl` string output from the backend.

1. Open the UI: [https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=\<endpointUrl\>](https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=<endpointUrl>).
1. Click the Share button on the top right.
1. From a second device, scan the QR code now displayed on the first device.
1. Choose the position value. For example, choosing position 1 would cause this device to always show one page further on than the first device. Negative numbers will cause it to show pages at lower number than the first device. Choosing position 0 will cause the second device to show the exact same page as the first device.
1. On either device, click the Open File button on the top right. After opening the PDF on one device is should soon appear automatically on the other device(s). The PDF is uploaded to S3 so this can take a while for very large PDFs.
1. Swipe, click, scroll etc to change page on any device. Other devices will change to the same page, plus or minus their position value.

It should be possible to load multiple devices by scanning the QR code generated on any other device (it does not always have to be the first device that generates the QR code). The backend should scale to be able to handle far more devices that would be practical.

### Other ways to load the UI

Uploading a file using the 'Open File' option is probably the slowest way to get a file loaded on all devices, because the primary device has to upload the file before the others can download it. If possible, it is therefore better to load the UI specifying a file which is already hosted at a URL accessible to all devices. For example (note `<file>` should be replaced with a URL-encoded version of the URL to the file):

- [https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=\<endpointUrl\>&file=\<file\>](https://tstibbs.github.io/pdf-viewer-sync/web#endpoint=<endpointUrl>&file=<file>)
- [https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=\<endpointUrl\>&file=https%3A%2F%2Fwww.example.com%2Ffile.pdf](https://tstibbs.github.io/pdf-viewer-sync/web#endpoint=<endpointUrl>&file=https%3A%2F%2Fwww.example.com%2Ffile.pdf)

As the file path is set in the 'hash' part of the URL, it can be updated without the page reloading. Thus, you can create a page of links to different PDFs which, when clicked, will cause the UI to load the new PDF on all devices. The following example shows how you would construct an index page of your PDFs (possibly only useful if you have a fixed set of PDFs). The first time you click on a link it will cause a new tab to open containing the UI. Subsequent clicks on links will cause the same tab to load the new pdf. The others linked UIs will then load the PDF from the same URL, so the file URLs need to be accessible to all devices. Example html:

```
<a target="pdfsync" href="https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=<endpointUrl>&file=https%3A%2F%2Fwww.example.com%2Ffile1.pdf">File 1.pdf</a>
<a target="pdfsync" href="https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=<endpointUrl>&file=https%3A%2F%2Fwww.example.com%2Ffile2.pdf">File 2.pdf</a>
```

# Contributing

PRs are very welcome, but for any big changes or new features please open an issue to discuss first.
