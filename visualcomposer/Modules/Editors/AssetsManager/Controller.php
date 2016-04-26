<?php

namespace VisualComposer\Modules\Editors\AssetsManager;

use VisualComposer\Application;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Options;
use VisualComposer\Helpers\File;
use VisualComposer\Framework\Illuminate\Contracts\Events\Dispatcher;
use VisualComposer\Helpers\Request;
use VisualComposer\Framework\Container;

/**
 * Class Controller.
 */
class Controller extends Container implements Module
{
    /**
     * @var \VisualComposer\Framework\Illuminate\Contracts\Events\Dispatcher
     */
    protected $event;
    /**
     * @var \VisualComposer\Helpers\Request
     */
    protected $request;
    /**
     * @var \VisualComposer\Helpers\Options
     */
    protected $options;
    /**
     * @var \VisualComposer\Helpers\File
     */
    protected $file;

    /**
     * Controller constructor.
     *
     * @param \VisualComposer\Framework\Illuminate\Contracts\Events\Dispatcher $event
     * @param \VisualComposer\Helpers\Request $request
     * @param \VisualComposer\Helpers\Options $optionsHelper
     * @param \VisualComposer\Helpers\File $fileHelper
     */
    public function __construct(Dispatcher $event, Request $request, Options $optionsHelper, File $fileHelper)
    {
        $this->event = $event;
        $this->request = $request;
        $this->options = $optionsHelper;
        $this->file = $fileHelper;

        $this->event->listen(
            'vcv:postAjax:setPostData',
            function () {
                $args = func_get_args();
                /** @see \VisualComposer\Modules\Editors\AssetsManager\Controller::setPostDataHook */
                $this->call('setPostDataHook', $args);
            }
        );

        add_action(
            'before_delete_post',
            function () {
                $args = func_get_args();
                /** @see \VisualComposer\Modules\Editors\AssetsManager\Controller::deletePostAssetsHook */
                $this->call('deletePostAssetsHook', $args);
            }
        );

        // Save compiled less into one css bundle.
        add_action(
            'vcv:ajax:loader:saveCssBundle:adminNonce',
            function () {
                $args = func_get_args();
                /** @see \VisualComposer\Modules\Editors\AssetsManager\Controller::saveCssBundleHook */
                $this->call('saveCssBundleHook', $args);
            }
        );
    }

    /**
     * @param $postId
     */
    public function setPostDataHook($postId)
    {
        $this->updatePostAssets(
            $postId,
            'scripts',
            $this->request->input('vcv-scripts', [])
        );
        $this->updatePostAssets(
            $postId,
            'styles',
            $this->request->input('vcv-styles', [])
        );
        $this->generateScriptsBundle();
        $styleBundles = $this->getStyleBundles();
        $this->terminate(
            json_encode(
                [
                    'success' => true,
                    'data' => [
                        'styleBundles' => $styleBundles,
                    ],
                ]
            )
        );
    }

    /**
     * Called every time post is permanently deleted.
     * Remove list of associated assets.
     *
     * @param int $postId Post ID
     */
    public function deletePostAssetsHook($postId)
    {
        foreach ([
            'scripts',
            'styles',
        ] as $assetType) {
            $assets = $this->options->get($assetType, []);

            if (!is_array($assets) || !isset($assets[ $postId ])) {
                continue;
            }

            unset($assets[ $postId ]);

            $this->options->set($assetType, $assets);
        }
    }

    /**
     * Save compiled less into one css bundle.
     */
    public function saveCssBundleHook()
    {
        $contents = $this->request->input('vcv-contents');

        $bundleUrl = $this->generateStylesBundle($contents);

        if ($bundleUrl === false) {
            $this->terminate(
                json_encode(
                    [
                        'success' => false,
                    ]
                )
            );
        }
        $this->terminate(
            json_encode(
                [
                    'success' => true,
                    'data' => [
                        'filename' => $bundleUrl,
                    ],
                ]
            )
        );
    }

    /**
     * Generate (save to fs and update db) scripts bundle.
     * Old files are deleted.
     *
     * @return bool|string URL to generated bundle.
     */
    private function generateScriptsBundle()
    {
        $assets = $this->options->get('scripts', []);

        $files = [];
        if (is_array($assets)) {
            foreach ($assets as $postId => $elements) {
                if (is_array($elements)) {
                    foreach ($elements as $element => $elementAssets) {
                        $files = array_merge($files, $elementAssets);
                    }
                }
            }
        }
        $files = array_unique($files);

        if (!empty($files)) {
            $uploadDir = wp_upload_dir();
            $concatenatedFilename = md5(implode(',', $files)) . '.js';
            $bundleUrl = $uploadDir['baseurl'] . '/' . VCV_PLUGIN_DIRNAME . '/asset-bundles' . '/'
                . $concatenatedFilename;

            $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/asset-bundles';
            $bundle = $destinationDir . '/' . $concatenatedFilename;
            /** @var $app Application */
            $app = vcapp();
            if (!is_file($bundle)) {
                $contents = '';
                foreach ($files as $file) {
                    $filepath = $app->path('public/sources/elements/' . $file);
                    $contents .= $this->file->getContents($filepath) . "\n";
                }

                $this->deleteAssetsBundles('js');
                if (!$this->file->setContents($bundle, $contents)) {
                    return false;
                }
            }
        } else {
            $this->deleteAssetsBundles('js');
            $bundleUrl = '';
        }

        $this->options->set('scriptsBundle', $bundleUrl);

        return $bundleUrl;
    }

    /**
     * Generate (save to fs and update db) scripts bundle.
     * Old files are deleted.
     *
     * @param string $contents CSS contents to save.
     *
     * @return bool|string URL to generated bundle.
     */
    private function generateStylesBundle($contents)
    {
        if ($contents) {
            $uploadDir = wp_upload_dir();
            $concatenatedFilename = md5($contents) . '.css';
            $bundleUrl = $uploadDir['baseurl'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles' . '/'
                . $concatenatedFilename;

            $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles';
            $bundle = $destinationDir . '/' . $concatenatedFilename;

            if (!is_file($bundle)) {
                $this->deleteAssetsBundles('css');
                if (!$this->file->setContents($bundle, $contents)) {
                    return false;
                }
            }
        } else {
            $this->deleteAssetsBundles('css');
            $bundleUrl = '';
        }

        $this->options->set('stylesBundle', $bundleUrl);

        return $bundleUrl;
    }

    /**
     * @return array
     */
    private function getStyleBundles()
    {
        $assets = $this->options->get('styles', []);

        $list = [];
        if (is_array($assets)) {
            foreach ($assets as $postId => $elements) {
                $list = array_merge($list, (array)$elements);
            }
        }

        $bundles = [];
        /** @var Application $app */
        $app = vcapp();
        foreach ($list as $element => $files) {
            $contents = '';
            if (is_array($files)) {
                foreach ($files as $file) {
                    $filepath = $app->path('public/sources/elements/' . $file);
                    $contents .= $this->file->getContents($filepath) . "\n";
                }
            }

            $bundles[] = [
                'filename' => $element . '.less',
                'contents' => $contents,
            ];
        }

        return $bundles;
    }

    /**
     * @param int $postId
     * @param string $assetType scripts|styles.
     * @param string[] $postAssets
     */
    private function updatePostAssets($postId, $assetType, $postAssets)
    {
        $assets = $this->options->get($assetType, []);
        if (!is_array($assets)) {
            $assets = [];
        }

        if ($postAssets) {
            $assets[ $postId ] = $postAssets;
        } else {
            unset($assets[ $postId ]); // TODO: check for isset??
        }

        $this->options->set($assetType, $assets);
    }

    /**
     * Remove all files by extension in asset-bundles directory.
     *
     * @param string $extension
     */
    private function deleteAssetsBundles($extension = '')
    {
        $uploadDir = wp_upload_dir();
        $destinationDir = $uploadDir['basedir'] . '/' . VCV_PLUGIN_DIRNAME . '/assets-bundles';

        if ($extension) {
            $extension = '.' . $extension;
        }
        // TODO: probably need to use rglob
        /** @see \VisualComposer\Application::rglob */
        $files = glob($destinationDir . '/*' . $extension);
        if (is_array($files)) {
            foreach ($files as $file) {
                unlink($file);
            }
        }
    }
}
