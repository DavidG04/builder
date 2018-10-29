<?php

namespace VisualComposer\Modules\License\Pages;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Traits\WpFiltersActions;
use VisualComposer\Helpers\License;
use VisualComposer\Helpers\Request;
use VisualComposer\Modules\Settings\Traits\Page;
use VisualComposer\Modules\Settings\Traits\SubMenu;

/**
 * Class GetPremiumRedesign.
 */
class GetPremiumRedesign extends Container implements Module
{
    use Page;
    use SubMenu;
    use EventsFilters;
    use WpFiltersActions;

    /**
     * @var string
     */
    protected $slug = 'vcv-go-premium';

    /**
     * @var string
     */
    protected $templatePath = 'license/layout';

    public function __construct(License $licenseHelper)
    {
        if (!vcvenv('VCV_FT_ACTIVATION_REDESIGN')) {
            return;
        }

        $this->wpAddAction(
            'admin_menu',
            function (License $licenseHelper, Request $requestHelper) {
                if (!$licenseHelper->isActivated()) {
                    /** @see \VisualComposer\Modules\License\Pages\GetPremium::addPage */
                    $this->call('addPage');
                } elseif ($requestHelper->input('page') === $this->getSlug()) {
                    wp_redirect(admin_url('admin.php?page=vcv-about'));
                    exit;
                }
            },
            70
        );

        if (!$licenseHelper->isActivated()) {
            $this->wpAddFilter(
                'plugin_action_links_' . VCV_PLUGIN_BASE_NAME,
                'pluginsPageLink'
            );
        }
    }

    /**
     *
     */
    protected function beforeRender()
    {
        $urlHelper = vchelper('Url');
        wp_register_script(
            'vcv:wpActivationRedesign:script',
            $urlHelper->assetUrl('dist/wpActivationRedesign.bundle.js'),
            [],
            VCV_VERSION
        );
        wp_register_style(
            'vcv:wpActivationRedesign:style',
            $urlHelper->assetUrl('dist/wpActivationRedesign.bundle.css'),
            [],
            VCV_VERSION
        );
        wp_enqueue_script('vcv:wpActivationRedesign:script');
        wp_enqueue_style('vcv:wpActivationRedesign:style');
    }

    /**
     * @throws \Exception
     */
    protected function addPage()
    {
        $page = [
            'slug' => $this->getSlug(),
            'title' => $this->buttonTitle(),
            'layout' => 'standalone',
            'showTab' => false,
            'controller' => $this,
            'capability' => 'manage_options',
        ];
        $this->addSubmenuPage($page);
    }

    protected function buttonTitle()
    {
        return sprintf(
            '<strong style="vertical-align: middle;font-weight:500;">%s</strong>',
            __('Go Premium', 'vcwb')
        );
    }

    /**
     * Add go premium link in plugins page
     *
     * @param $links
     *
     * @return mixed
     */
    protected function pluginsPageLink($links)
    {
        /** @noinspection HtmlUnknownTarget */
        $goPremiumLink = sprintf(
            '<a href="%s">%s</a>',
            esc_url(admin_url('admin.php?page=vcv-go-premium')) . '&vcv-ref=plugins-page',
            __('Go Premium', 'vcwb')
        );

        array_push($links, $goPremiumLink);

        return $links;
    }
}
