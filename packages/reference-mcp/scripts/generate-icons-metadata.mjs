import { writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const targetJsonPath = join(here, '../src/data/icons-metadata.json')
const jsxNamesPath = join(here, '../../reference-icons/src/jsx-names.ts')

function matchTokens(slug, ...tokens) {
  const parts = slug.split('_')
  return tokens.some(t => {
    if (t.includes('_')) {
      return slug === t || slug.startsWith(t + '_') || slug.endsWith('_' + t) || slug.includes('_' + t + '_')
    }
    return parts.includes(t)
  })
}

// Visual motif definitions and shape patterns for Material Symbols
const VISUAL_MOTIFS = [
  // Verified Batches #0 – #10 Exact Definitions
  { exact: ['abc'], visual: 'uppercase letters ABC in a clean sans-serif typeface', usage: 'text formatting, font selection, alphabet switching, and language tools', cat: 'action' },
  { exact: ['accessibility'], visual: 'a figure of a person standing upright with arms outstretched horizontally in a T-pose', usage: 'accessibility options, inclusive design, assistive tech, and mobility settings', cat: 'action' },
  { exact: ['accessibility_new'], visual: 'a dynamic figure of a person standing with arms raised diagonally upward in a V-pose', usage: 'inclusive design, assistive technologies, universal access, and accessibility settings', cat: 'action' },
  { exact: ['accessible_forward'], visual: 'a stylized wheelchair user leaning forward in active motion', usage: 'accessible transit, disabled access, active wheelchair navigation, and mobility facilities', cat: 'action' },
  { exact: ['accessible'], visual: 'the international symbol of access depicting a person sitting in a wheelchair', usage: 'wheelchair accessibility, disability accommodations, elevator access, and universal design', cat: 'action' },
  { exact: ['accessible_menu'], visual: 'a person with outstretched arms next to vertical context menu dots', usage: 'accessibility menus, assistive option panels, and accessibility configuration triggers', cat: 'action' },
  { exact: ['account_balance'], visual: 'a classical multi-column building facade with a triangular roof pediment', usage: 'financial institutions, banking transfers, treasury accounts, and court/legal domains', cat: 'action' },
  { exact: ['account_balance_wallet'], visual: 'a leather bifold wallet with a rounded flap and circular snap clasp', usage: 'digital wallets, payment methods, stored funds, card management, and crypto accounts', cat: 'action' },
  { exact: ['account_box'], visual: 'a square picture frame containing the head-and-shoulders avatar silhouette of a person', usage: 'user profile cards, account management, identity badges, and employee directories', cat: 'social' },
  { exact: ['account_child', 'account_child_invert'], visual: 'a parent silhouette figure with a smaller child silhouette nestled within the torso', usage: 'family accounts, parental controls, dependent profiles, and child sub-accounts', cat: 'social' },
  { exact: ['account_circle'], visual: 'a circular avatar container enclosing the silhouette of a person head and shoulders', usage: 'user profile navigation, login avatars, account settings, and personal account status', cat: 'social' },
  { exact: ['account_circle_off'], visual: 'a circular avatar of a person crossed out by a bold diagonal strike-through slash', usage: 'logged out state, disabled user accounts, incognito browsing, and deactivating profiles', cat: 'social' },
  { exact: ['account_tree'], visual: 'three rectangular organizational chart nodes connected by branching right-angle lineage lines', usage: 'organizational hierarchies, folder trees, account hierarchies, Git branch trees, and workflow node graphs', cat: 'action' },
  { exact: ['action_key'], visual: 'a 2x2 grid of circular key buttons with a magnifying glass lens in the lower-right', usage: 'action shortcuts, hotkey configurations, command palettes, and custom key bindings', cat: 'action' },
  { exact: ['activity_zone'], visual: 'a boundary bounding box with square corner handles and dashed perimeter lines', usage: 'security camera activity zones, motion detection boundaries, crop areas, and geo-fencing', cat: 'action' },
  { exact: ['ac_unit'], visual: 'a six-pointed symmetrical snowflake motif with radial branched arms', usage: 'air conditioning, climate cooling, HVAC settings, and refrigeration', cat: 'places' },
  { exact: ['acupuncture'], visual: 'three vertical acupuncture needles with spiral loop handles inserted into tissue', usage: 'acupuncture therapy, alternative medicine, pain management, and holistic health', cat: 'places' },
  { exact: ['acute'], visual: 'a circular clock timer glyph with horizontal motion speed lines trailing to the left', usage: 'acute emergency medical conditions, urgent fast-response triage, expedited care, and quick timers', cat: 'places' },
  { exact: ['adaptive_audio_mic', 'adaptive_audio_mic_off'], visual: 'a studio microphone glyph flanked by sound waves and audience person silhouettes', usage: 'adaptive audio adjustments, dynamic noise cancellation, smart voice isolation, and conference microphone tuning', cat: 'av' },
  { exact: ['adb'], visual: 'an Android bug robot head silhouette with antennae', usage: 'Android debugging, developer bridge connections, and mobile app testing', cat: 'action' },
  { exact: ['add_location_alt', 'add_location'], visual: 'a teardrop geolocation map pin with an overlaid plus (+) sign badge', usage: 'adding map locations, saving new places, bookmarking coordinates, and address entry', cat: 'maps' },
  { exact: ['add_moderator'], visual: 'a security shield emblem with an attached circular plus (+) badge', usage: 'assigning moderator privileges, adding admin roles, and community safety permissions', cat: 'action' },
  { exact: ['add_notes'], visual: 'a document note page with an attached circular plus (+) badge', usage: 'creating text notes, adding annotations, attaching memos, and quick scratchpad entries', cat: 'action' },
  { exact: ['add_photo_alternate'], visual: 'a landscape photo frame with sun/mountains and an overlaid plus (+) badge', usage: 'uploading secondary photos, adding gallery images, and attaching picture media', cat: 'image' },
  { exact: ['add_reaction'], visual: 'a smiling emoji face with an overlaid plus (+) badge', usage: 'adding emoji reactions to comments, reacting to posts, and sentiment feedback', cat: 'social' },
  { exact: ['add_road'], visual: 'two parallel dashed highway road lanes with an adjacent plus (+) badge', usage: 'adding road segments, mapping new routes, transit construction, and GPS path editing', cat: 'maps' },
  { exact: ['add_row_above', 'add_row_below'], visual: 'a partitioned table row layout with a plus (+) indicator in the upper or lower segment', usage: 'inserting rows above or below active cells in tables and spreadsheet editors', cat: 'editor' },
  { exact: ['add_shopping_cart'], visual: 'a wireframe shopping cart on wheels with an overlaid plus (+) sign', usage: 'adding items to e-commerce cart, purchasing products, and adding to shopping basket', cat: 'action' },
  { exact: ['add_task'], visual: 'a circular checkmark tick combined with an adjacent plus (+) badge', usage: 'creating new tasks, adding checklist items, scheduling todos, and assigning work items', cat: 'action' },
  { exact: ['add_to_drive'], visual: 'a triangular Google Drive logo symbol paired with an overlaid plus (+) badge', usage: 'saving files to Google Drive, cloud storage shortcuts, and cloud drive backup', cat: 'file' },
  { exact: ['add_to_queue'], visual: 'a desktop computer monitor screen with a centered plus (+) sign', usage: 'adding media to playback queues, queuing videos, and playlist sequencing', cat: 'av' },
  { exact: ['add_triangle'], visual: 'an equilateral triangle outline enclosing a centered plus (+) sign', usage: 'creating custom vector shapes, geometric drafting tools, and CAD polygon additions', cat: 'editor' },
  { exact: ['adf_scanner'], visual: 'an automatic document feeder (ADF) flatbed office printer scanner device', usage: 'scanning multi-page documents, batch paper digitization, and office hardware controls', cat: 'hardware' },
  { exact: ['ad_group', 'ad_group_off', 'ad', 'ad_off'], visual: 'overlapping rectangular browser advertisement preview window frames', usage: 'ad campaign groupings, digital ad previews, sponsored marketing units, and ad blocking', cat: 'action' },
  { exact: ['adjust'], visual: 'concentric circular bullseye target rings', usage: 'contrast adjustments, focus targeting, calibration controls, and alignment settings', cat: 'image' },
  { exact: ['admin_meds'], visual: 'a medical chart clipboard stamped with a capsule pill glyph', usage: 'administering medication, prescription dosages, patient charts, and pharmacy records', cat: 'places' },
  { exact: ['admin_panel_settings'], visual: 'a defensive security shield with a user avatar badge in the lower corner', usage: 'admin control panels, security privileges, administrative settings, and role management', cat: 'action' },
  { exact: ['ads_click'], visual: 'concentric circular radar target rings with a mouse pointer cursor clicking the center', usage: 'ad click tracking, pay-per-click metrics, target interaction analytics, and call-to-action triggers', cat: 'action' },
  { exact: ['agender'], visual: 'a gender identity symbol with a circle and vertical line crossed by a top bar', usage: 'gender identity selection, demographic profiling, and inclusive user settings', cat: 'social' },
  { exact: ['agriculture'], visual: 'a farm tractor vehicle silhouette with large rear tread wheels', usage: 'agricultural machinery, farming operations, crop harvesting, and rural transit', cat: 'maps' },
  { exact: ['air_freshener'], visual: 'a hanging car scent diffuser bottle emitting vapor aroma droplets', usage: 'vehicle air fresheners, ambient aromatics, fragrance controls, and automotive care', cat: 'places' },
  { exact: ['air'], visual: 'three horizontal flowing wind breeze stream lines', usage: 'wind speed forecasts, atmospheric conditions, airflow settings, and ventilation', cat: 'places' },
  { exact: ['airline_seat_flat_angled', 'airline_seat_flat', 'airline_seat_individual_suite'], visual: 'a reclined or fully flat passenger airplane bed with headrest pillows and cabin suite', usage: 'first class flight bookings, lie-flat cabin seating, premium travel reservations, and overnight comfort', cat: 'places' },
  { exact: ['airline_seat_legroom_extra', 'airline_seat_legroom_normal', 'airline_seat_legroom_reduced'], visual: 'an airplane passenger seat profile showing extended, standard, or tight legroom clearance', usage: 'selecting airplane seat legroom, cabin seating tiers, and flight comfort preferences', cat: 'places' },
  { exact: ['airline_seat_recline_extra', 'airline_seat_recline_normal'], visual: 'an airplane passenger seat shown in deep recline or standard upright seating posture', usage: 'flight recline preferences, cabin seat configurations, and passenger comfort', cat: 'places' },
  { exact: ['airlines'], visual: 'an upright commercial passenger airplane vertical tail fin stabilizer with a window', usage: 'airline carriers, flight operators, airport fleet management, and aviation brands', cat: 'maps' },
  { exact: ['airline_stops'], visual: 'a curved navigational flight trajectory path with a branching layover waypoint stop', usage: 'flight layovers, connecting stops, multi-city itineraries, and transit waypoints', cat: 'maps' },
  { exact: ['airplanemode_inactive', 'airplanemode_active'], visual: 'a passenger jet airplane silhouette either active or crossed out with a diagonal slash', usage: 'toggling airplane mode, disabling wireless radios, flight safe mode, and network disconnection', cat: 'device' },
  { exact: ['airplane_ticket'], visual: 'a rectangular boarding pass ticket voucher printed with an airplane silhouette', usage: 'flight tickets, mobile boarding passes, flight check-in, and travel booking confirmations', cat: 'maps' },
  { exact: ['airplay'], visual: 'a rectangular monitor display with an upward triangle wireless projection beam', usage: 'AirPlay screen mirroring, casting display to TV, and wireless video streaming', cat: 'av' },
  { exact: ['airport_shuttle'], visual: 'a passenger minivan transport shuttle bus vehicle silhouette', usage: 'airport shuttles, hotel van transfers, group passenger transit, and ground transportation', cat: 'maps' },
  { exact: ['air_purifier_gen', 'air_purifier'], visual: 'a standing tower or tabletop home air purifier appliance blowing horizontal air currents', usage: 'air purifier devices, smart home air filtration, clean air mode, and allergen reduction', cat: 'device' },
  { exact: ['airwave'], visual: 'three stacked oscillating wavy air current lines', usage: 'airwave broadcasts, acoustic audio waves, air quality resonance, and wave dynamics', cat: 'av' },
  { exact: ['alarm_add', 'alarm', 'alarm_off', 'alarm_on', 'alarm_pause', 'alarm_smart_wake'], visual: 'a traditional twin-bell alarm clock face with hands, plus sign, checkmark, pause bars, or wake dots', usage: 'setting alarm clocks, wake-up schedules, alarm timers, and sleep tracking', cat: 'action' },
  { exact: ['album'], visual: 'a circular vinyl music record disc with a central label spindle hole', usage: 'music albums, vinyl disc collections, audio tracks, and music library categories', cat: 'av' },
  { exact: ['all_inbox'], visual: 'stacked cascading document trays representing unified email inboxes', usage: 'unified inbox view, reading all incoming messages across accounts, and mail aggregation', cat: 'communication' },
  { exact: ['all_inclusive'], visual: 'the horizontal infinity figure-eight loop symbol (∞)', usage: 'unlimited plans, all-inclusive resort packages, infinite loops, and lifetime subscriptions', cat: 'action' },
  { exact: ['all_match'], visual: 'a Greek capital sigma summation symbol (Σ) paired with a circular checkmark badge', usage: 'matching all conditions, SQL complete query filters, and total validation matches', cat: 'action' },
  { exact: ['all_out'], visual: 'a central circle bounded by four corner bracket handles pointing outward', usage: 'expanding to full view, maximizing canvas focus, and full-screen workspace immersion', cat: 'action' },
  { exact: ['alternate_email'], visual: 'the typographical commercial at-sign symbol (@)', usage: 'mentioning users, entering email addresses, tagging collaborators, and social handles', cat: 'communication' },
  { exact: ['altitude'], visual: 'a mountain peak landscape with an upward-pointing diagonal elevation ascent arrow', usage: 'altimeter readings, mountain climbing elevation, topographic altitude, and hike tracking', cat: 'maps' },
  { exact: ['alt_route'], visual: 'a navigational path line branching into two separate directional arrow routes', usage: 'alternative navigation routes, detours, route comparisons, and traffic avoidance', cat: 'maps' },
  { exact: ['ambulance'], visual: 'an emergency medical rescue van with a top siren light and cross badge', usage: 'calling emergency ambulance, paramedic dispatch, medical transit, and urgent care services', cat: 'places' },
  { exact: ['amend'], visual: 'a circular counterclockwise looping arrow containing an inner horizontal bar', usage: 'amending records, modifying submitted forms, revising transactions, and version edits', cat: 'action' },
  { exact: ['amp_stories'], visual: 'a central vertical story card flanked by side preview panels (AMP stories)', usage: 'interactive web stories, mobile visual narrative feeds, and media story highlights', cat: 'content' },
  { exact: ['analytics'], visual: 'a framed column bar chart with ascending metrics data bars', usage: 'analytics dashboards, tracking user traffic, performance metrics, and reporting insights', cat: 'action' },
  { exact: ['anchor'], visual: 'a maritime nautical ship anchor with a top ring, crossbar, and curved flukes', usage: 'anchoring viewport position, scroll anchors, maritime nautical themes, and fixed links', cat: 'action' },
  { exact: ['android'], visual: 'an Android mascot robot head silhouette with twin angled antennae', usage: 'Android platform settings, Google Android operating system, and mobile device settings', cat: 'hardware' },
  { exact: ['animation'], visual: 'two interlocking circular motion rings representing multi-frame animation', usage: 'keyframe animation tools, CSS transition controls, motion graphics, and video effects', cat: 'editor' },
  { exact: ['antigravity'], visual: 'a smooth upward curving parabolic arch crest (Antigravity emblem)', usage: 'Antigravity developer tools, intelligent agent operations, and workspace acceleration', cat: 'action' },
  { exact: ['apartment'], visual: 'a multi-story urban residential apartment high-rise building with a grid of windows', usage: 'apartment rentals, real estate residential listings, urban buildings, and housing search', cat: 'places' },
  { exact: ['api'], visual: 'four linked diamond tiles connected in a diamond interface matrix', usage: 'REST/GraphQL API endpoints, developer API integrations, and backend webhooks', cat: 'action' },
  { exact: ['apk_document', 'apk_install'], visual: 'an Android package (APK) document sheet stamped with a robot head and download arrow', usage: 'installing Android APK packages, side-loading applications, and package file managers', cat: 'file' },
  { exact: ['apparel'], visual: 'a short-sleeve casual cotton t-shirt garment silhouette', usage: 'clothing stores, apparel catalogs, fashion merchandise, and wardrobe categories', cat: 'action' },
  { exact: ['app_badging'], visual: 'a circular notification badge ring with an active unread indicator dot at 2 o clock', usage: 'app badge settings, unread notification counts, and notification indicator dots', cat: 'notification' },
  { exact: ['app_registration'], visual: 'an application grid of four tiles with an editing stylus pen modifying a tile', usage: 'registering developer apps, modifying OAuth client applications, and portal setups', cat: 'action' },
  { exact: ['approval_delegation', 'approval_delegation_off', 'approval'], visual: 'an outstretched hand offering a checkmark tick or physical document rubber stamp', usage: 'approving requests, delegating sign-off authority, manager approvals, and official verification seals', cat: 'action' },
  { exact: ['apps', 'apps_outage'], visual: 'a 3x3 square grid of nine application launcher dots, with or without an outage alert mark', usage: 'app launchers, workspace suite navigation, and cloud service outage alerts', cat: 'navigation' },
  { exact: ['aq', 'aq_indoor'], visual: 'bold capital letters AQ or a house outline containing undulating indoor airflow currents', usage: 'air quality index (AQI) ratings, environmental pollution monitoring, and smart HVAC air safety', cat: 'places' },
  { exact: ['architecture'], visual: 'a pair of drafting divider calipers or technical drawing compass legs', usage: 'architectural blueprints, precision CAD drafting, geometric drawing, and technical modeling', cat: 'editor' },
  { exact: ['archive'], visual: 'a storage filing box with a downward-pointing arrow lowering files inside', usage: 'archiving old conversations, storing historical records, and moving items to long-term storage', cat: 'action' },
  { exact: ['area_chart'], visual: 'a mountainous filled area chart with filled shading below the line curve', usage: 'area chart visualizations, volume over time metrics, and statistical dashboards', cat: 'editor' },
  { exact: ['arming_countdown'], visual: 'a security shield emblem containing a circular countdown timer sweep', usage: 'security system arming timers, alarm delays, and property protection countdowns', cat: 'action' },
  { exact: ['ar_on_you'], visual: 'a face viewfinder bracket with corner crosshairs enclosing a smiling avatar face', usage: 'augmented reality (AR) face filters, selfie camera effects, and facial tracking', cat: 'image' },
  { exact: ['arrow_and_edge'], visual: 'a branching line connecting two endpoints and descending into a central downward arrow', usage: 'merging data branches, flowchart connections, and descending process transitions', cat: 'navigation' },
  { exact: ['arrow_cool_down'], visual: 'a vertical downward arrow topped with a dashed thermal tail stem', usage: 'cooling down temperature controls, device thermal throttling, and cooling fans', cat: 'device' },

  // Navigation & Directional
  { match: (s) => matchTokens(s, 'arrow_back', 'arrow_left', 'keyboard_arrow_left', 'chevron_left', 'arrow_back_ios', 'west'), visual: 'a leftward-pointing horizontal arrow or chevron stem', usage: 'navigating back, returning to previous screens, and paginating backward', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'arrow_forward', 'arrow_right', 'keyboard_arrow_right', 'chevron_right', 'arrow_forward_ios', 'east'), visual: 'a rightward-pointing horizontal arrow or chevron stem', usage: 'navigating forward, proceeding to the next step, and expanding submenus', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'arrow_upward', 'keyboard_arrow_up', 'expand_less', 'north', 'arrow_drop_up'), visual: 'an upward-pointing vertical arrow, chevron, or triangle caret', usage: 'scrolling to top, collapsing expandable panels, and ascending values', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'arrow_downward', 'keyboard_arrow_down', 'expand_more', 'south', 'arrow_drop_down'), visual: 'a downward-pointing vertical arrow, chevron, or triangle caret', usage: 'expanding dropdown menus, accordion sections, and scrolling down', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'menu', 'menu_open', 'hamburger'), visual: 'three stacked horizontal parallel lines', usage: 'toggling primary navigation drawers, sidebars, and app menus', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'more_vert'), visual: 'three vertically aligned circular dots', usage: 'opening vertical context menus, row actions, and overflow options', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'more_horiz'), visual: 'three horizontally aligned circular dots', usage: 'opening horizontal overflow menus, pagination ellipses, and extra actions', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'apps', 'grid_view', 'view_module', 'widgets'), visual: 'a geometric grid of square app tiles', usage: 'app launchers, workspace pickers, and grid view toggles', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'compass', 'explore', 'travel_explore'), visual: 'a circular magnetic compass dial with needle points', usage: 'discovery feeds, exploration modes, and navigation hubs', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'near_me', 'navigation', 'my_location'), visual: 'an angled directional navigation arrowhead wedge', usage: 'turn-by-turn navigation, locating current heading, and route guidance', cat: 'navigation' },
  { match: (s) => matchTokens(s, 'route', 'alt_route', 'directions'), visual: 'a branching navigational path with connected waypoints', usage: 'route planning, alternative directions, and transit paths', cat: 'navigation' },

  // Commerce & Finance
  { match: (s) => matchTokens(s, 'shopping_cart', 'add_shopping_cart', 'remove_shopping_cart', 'shopping_cart_checkout', 'garden_cart', 'cart'), visual: 'a wireframe shopping cart on wheels with a push handle', usage: 'e-commerce shopping carts, purchasing items, checkout flows, and orders', cat: 'action' },
  { match: (s) => matchTokens(s, 'shopping_bag', 'shopping_basket', 'storefront', 'store', 'local_mall'), visual: 'a retail shopping bag with loop handles or commercial storefront', usage: 'retail stores, merchant product catalogs, orders, and checkout', cat: 'action' },
  { match: (s) => matchTokens(s, 'wallet', 'account_balance_wallet'), visual: 'a leather bifold wallet with a rounded flap and clasp', usage: 'digital wallets, payment methods, stored balance, and financial accounts', cat: 'action' },
  { match: (s) => matchTokens(s, 'account_balance', 'bank'), visual: 'a classical multi-column building facade with a triangular pediment', usage: 'financial institutions, banking transfers, treasury accounts, and wire payments', cat: 'action' },
  { match: (s) => matchTokens(s, 'credit_card', 'payment', 'credit_score'), visual: 'a rectangular plastic credit card with a magnetic stripe band', usage: 'credit or debit card payments, checkout forms, and billing details', cat: 'action' },
  { match: (s) => matchTokens(s, 'savings', 'piggy_bank'), visual: 'a cute piggy bank silhouette with a top coin slot', usage: 'savings accounts, investment goals, monetary deposits, and wealth tracking', cat: 'action' },
  { match: (s) => matchTokens(s, 'receipt', 'receipt_long', 'invoice', 'request_quote'), visual: 'a paper receipt with zig-zag notched top and bottom edges', usage: 'order receipts, billing invoices, transaction history, and purchase proofs', cat: 'action' },
  { match: (s) => matchTokens(s, 'attach_money', 'monetization_on', 'paid', 'payments', 'currency_exchange', 'dollar', 'euro', 'currency_pound', 'currency_yen'), visual: 'currency denominations, coins, and paper banknotes', usage: 'monetary pricing, cash payments, financial revenue, and currency conversions', cat: 'action' },

  // Actions & UI Triggers
  { match: (s) => matchTokens(s, 'delete', 'delete_forever', 'delete_sweep', 'auto_delete', 'restore_from_trash'), visual: 'an open-top trash receptacle with a removable top lid handle', usage: 'destructive delete actions, removing items, clearing rows, and discarding content', cat: 'action' },
  { match: (s) => matchTokens(s, 'search', 'saved_search', 'manage_search', 'search_check', 'find_in_page', 'find_replace'), visual: 'a magnifying glass with a round convex lens angled diagonally', usage: 'search inputs, record lookups, filter bars, and query triggers', cat: 'action' },
  { match: (s) => matchTokens(s, 'edit', 'mode_edit', 'edit_note', 'edit_document', 'create', 'draw', 'design_services'), visual: 'a pointed pencil or pen angled at 45 degrees', usage: 'editing content, modifying records, inline text editing, and updating entries', cat: 'action' },
  { match: (s) => matchTokens(s, 'close', 'cancel', 'clear', 'highlight_off'), visual: 'a diagonal X cross mark', usage: 'closing dialogs, dismissing notifications, canceling operations, and clearing inputs', cat: 'action' },
  { match: (s) => matchTokens(s, 'check', 'done', 'done_all', 'check_circle', 'task_alt'), visual: 'a checkmark tick glyph', usage: 'confirming actions, indicating completed tasks, positive validation, and selected options', cat: 'action' },
  { match: (s) => matchTokens(s, 'add', 'add_circle', 'create_new_folder', 'plus_one'), visual: 'a symmetrical plus (+) cross sign', usage: 'creating new items, adding records, expanding sections, and inserting elements', cat: 'action' },
  { match: (s) => matchTokens(s, 'remove', 'remove_circle', 'indeterminate_check_box'), visual: 'a horizontal minus (-) stroke line', usage: 'reducing quantities, removing items, collapsing sections, and decrementing values', cat: 'action' },
  { match: (s) => matchTokens(s, 'refresh', 'sync', 'sync_alt', 'sync_problem', 'autorenew', 'restart_alt', 'update'), visual: 'a circular looping arrow forming a continuous cycle', usage: 'reloading data, synchronizing state, resetting inputs, and refreshing feeds', cat: 'action' },
  { match: (s) => matchTokens(s, 'download', 'file_download', 'get_app', 'install_desktop', 'install_mobile'), visual: 'a downward arrow pointing into a horizontal tray base', usage: 'downloading files, saving local exports, and fetching attachments', cat: 'action' },
  { match: (s) => matchTokens(s, 'upload', 'file_upload', 'publish', 'backup'), visual: 'an upward arrow emerging from a horizontal tray base', usage: 'uploading documents, attaching files, and sending assets to the cloud', cat: 'action' },
  { match: (s) => matchTokens(s, 'share', 'ios_share'), visual: 'three circular nodes linked by branching connection lines', usage: 'sharing content, social distribution, export links, and collaboration', cat: 'social' },
  { match: (s) => matchTokens(s, 'content_copy', 'copy_all', 'file_copy'), visual: 'two overlapping rectangular document sheets', usage: 'copying text to clipboard, duplicating records, and cloning items', cat: 'action' },
  { match: (s) => matchTokens(s, 'content_paste', 'paste', 'assignment'), visual: 'a rigid clipboard with an attached sheet of paper', usage: 'pasting clipboard content, inserting copied text, and clipboard managers', cat: 'action' },
  { match: (s) => matchTokens(s, 'content_cut', 'cut'), visual: 'a pair of opened scissors with looped handles', usage: 'cutting text or objects to clipboard and trimming media segments', cat: 'action' },
  { match: (s) => matchTokens(s, 'filter_list', 'filter_alt', 'filter_alt_off'), visual: 'a funnel-shaped liquid strainer receptacle', usage: 'filtering table data, refining search results, and category sorting', cat: 'action' },
  { match: (s) => matchTokens(s, 'sort', 'sort_by_alpha'), visual: 'multiple horizontal bars of ascending or descending lengths', usage: 'sorting lists, ordering columns, and rearranging data records', cat: 'action' },
  { match: (s) => matchTokens(s, 'thumb_up', 'recommend'), visual: 'a hand with an erect thumb pointing upward', usage: 'liking content, positive feedback, approval, and recommendations', cat: 'social' },
  { match: (s) => matchTokens(s, 'thumb_down'), visual: 'a hand with a thumb pointing downward', usage: 'disliking content, negative feedback, rejection, and downvoting', cat: 'social' },
  { match: (s) => matchTokens(s, 'bookmark', 'bookmark_add', 'bookmark_remove', 'bookmark_border', 'bookmarks'), visual: 'a vertical ribbon banner tag notched at the bottom', usage: 'saving bookmarks, marking reading position, and saving favorite records', cat: 'action' },
  { match: (s) => matchTokens(s, 'favorite', 'favorite_border', 'heart_plus', 'heart_check'), visual: 'a symmetrical heart shape outline or fill', usage: 'favoriting items, liking posts, saving wishlist items, and health indicators', cat: 'action' },
  { match: (s) => matchTokens(s, 'star', 'star_rate', 'star_half', 'star_border', 'stars', 'grade'), visual: 'a five-pointed star glyph', usage: 'rating items, bookmarking favorites, highlighting featured content, and reviews', cat: 'action' },
  { match: (s) => matchTokens(s, 'visibility_off', 'visibility_lock'), visual: 'an almond-shaped eye with a diagonal strike-through slash', usage: 'hiding password text, concealing sensitive data, and masking content', cat: 'action' },
  { match: (s) => matchTokens(s, 'visibility', 'preview', 'remove_red_eye'), visual: 'an almond-shaped eye with a central iris pupil', usage: 'toggling password visibility, previewing content, and viewing details', cat: 'action' },
  { match: (s) => matchTokens(s, 'lock_open'), visual: 'a padlock with an open, unclasped shackle', usage: 'unlocked state, granting access, opening permissions, and public visibility', cat: 'action' },
  { match: (s) => matchTokens(s, 'lock', 'lock_clock', 'lock_reset'), visual: 'a solid padlock with a curved shackle and keyhole body', usage: 'security, restricted access, password protection, and locked state', cat: 'action' },
  { match: (s) => matchTokens(s, 'vpn_key', 'key', 'key_off', 'password'), visual: 'a metallic key with a round bow and notched bit blade', usage: 'authentication, access keys, security credentials, and unlock actions', cat: 'action' },
  { match: (s) => matchTokens(s, 'shield', 'shield_lock', 'shield_person', 'security', 'verified_user', 'policy'), visual: 'a defensive heraldic shield emblem', usage: 'security status, data protection, privacy policy, and threat defense', cat: 'action' },
  { match: (s) => matchTokens(s, 'fingerprint'), visual: 'concentric curved biometric fingerprint ridge loops', usage: 'biometric authentication, touch ID verification, and digital identity security', cat: 'action' },
  { match: (s) => matchTokens(s, 'label', 'label_important', 'label_off', 'new_label', 'local_offer', 'tag', 'car_tag'), visual: 'a luggage price tag with a string hole notch', usage: 'tagging items, organizing labels, keyword categorization, and pricing', cat: 'action' },
  { match: (s) => matchTokens(s, 'flag', 'flag_circle', 'outlined_flag'), visual: 'a triangular or rectangular flag waving on a vertical flagpole', usage: 'marking priority milestones, reporting inappropriate content, and language selection', cat: 'action' },
  { match: (s) => matchTokens(s, 'send', 'unarchive'), visual: 'a folded paper airplane angled diagonally upward', usage: 'sending messages, submitting forms, transmitting data, and chat triggers', cat: 'communication' },
  { match: (s) => matchTokens(s, 'reply_all'), visual: 'a stacked double curved arrow pointing leftward', usage: 'replying to all email recipients and thread participants', cat: 'communication' },
  { match: (s) => matchTokens(s, 'reply'), visual: 'a single curved arrow looping backward to the left', usage: 'replying to messages, commenting on threads, and undoing actions', cat: 'communication' },
  { match: (s) => matchTokens(s, 'forward', 'forward_to_inbox'), visual: 'a curved arrow looping forward to the right', usage: 'forwarding messages, emails, and sharing posts to external contacts', cat: 'communication' },
  { match: (s) => matchTokens(s, 'undo'), visual: 'a counterclockwise curved arrow arching backward', usage: 'undoing previous operations, reversing text edits, and history rollbacks', cat: 'action' },
  { match: (s) => matchTokens(s, 'redo'), visual: 'a clockwise curved arrow arching forward', usage: 'redoing reverted operations and re-applying rolled back text changes', cat: 'action' },
  { match: (s) => matchTokens(s, 'history', 'update', 'history_toggle_off', 'manage_history'), visual: 'a circular clock face with a counterclockwise outer perimeter arrow', usage: 'viewing activity history, audit logs, recent changes, and version tracking', cat: 'action' },
  { match: (s) => matchTokens(s, 'schedule', 'alarm', 'alarm_on', 'alarm_off', 'timer', 'timer_off', 'hourglass_empty', 'hourglass_full', 'watch_later'), visual: 'a circular clock face or hourglass measuring duration', usage: 'time pickers, event schedules, duration logs, and alarm timers', cat: 'action' },

  // Communication & Social
  { match: (s) => matchTokens(s, 'chat', 'chat_bubble', 'comment', 'sms', 'textsms', 'mark_chat_unread', 'mark_chat_read', 'question_answer'), visual: 'a rounded conversational speech bubble with a bottom tail pointer', usage: 'chat messages, user comments, discussions, and instant messaging', cat: 'communication' },
  { match: (s) => matchTokens(s, 'forum'), visual: 'two overlapping speech bubbles representing dialogue', usage: 'community forums, group discussions, thread conversations, and FAQs', cat: 'communication' },
  { match: (s) => matchTokens(s, 'mail', 'email', 'envelope', 'mark_email_read', 'mark_email_unread', 'drafts', 'inbox', 'outgoing_mail'), visual: 'a rectangular folded letter envelope with a triangular flap', usage: 'email messages, inbox items, contact forms, and mail notifications', cat: 'communication' },
  { match: (s) => matchTokens(s, 'phone', 'call', 'call_end', 'phone_in_talk', 'phone_enabled', 'phone_disabled', 'ring_volume', 'dialer_sip'), visual: 'a telephone handset receiver curve', usage: 'voice calls, phone contacts, support hotlines, and dialer triggers', cat: 'communication' },
  { match: (s) => matchTokens(s, 'videocam', 'video_call', 'videocam_off', 'duo', 'meet'), visual: 'a portable video camera with a front lens and body casing', usage: 'video conferencing, live streaming, video recording, and meetings', cat: 'communication' },
  { match: (s) => matchTokens(s, 'person_add', 'group_add', 'person_add_alt'), visual: 'a silhouette of a person accompanied by a plus (+) symbol', usage: 'inviting team members, adding contacts, and user registration', cat: 'social' },
  { match: (s) => matchTokens(s, 'group', 'groups', 'people', 'people_alt', 'diversity_1', 'diversity_2', 'diversity_3'), visual: 'silhouettes of multiple people standing side-by-side', usage: 'team directories, group management, community members, and organizations', cat: 'social' },
  { match: (s) => matchTokens(s, 'person', 'account_circle', 'account_box', 'portrait', 'avatar', 'face', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6'), visual: 'a head-and-shoulders silhouette of a person', usage: 'user profiles, account settings, member directories, and identity avatars', cat: 'social' },
  { match: (s) => matchTokens(s, 'badge', 'co_present', 'assignment_ind'), visual: 'an identification name tag with a portrait photo cutout', usage: 'employee IDs, profile badges, membership credentials, and role verification', cat: 'social' },

  // System, Settings & Hardware
  { match: (s) => matchTokens(s, 'settings', 'admin_panel_settings', 'settings_suggest', 'settings_applications', 'display_settings', 'settings_accessibility'), visual: 'a circular cog wheel with gear teeth', usage: 'system settings, configuration panels, user preferences, and admin tools', cat: 'action' },
  { match: (s) => matchTokens(s, 'tune', 'sliders', 'tune_off', 'adjust'), visual: 'horizontal adjustment slider bars with movable indicator handles', usage: 'fine-tuning audio/display parameters, filter configurations, and preferences', cat: 'action' },
  { match: (s) => matchTokens(s, 'build', 'construction', 'handyman', 'home_repair_service', 'hardware'), visual: 'a mechanical adjustable wrench or construction tool', usage: 'maintenance tools, developer options, troubleshooting, and repairs', cat: 'action' },
  { match: (s) => matchTokens(s, 'notifications', 'notification_important', 'notifications_active', 'notifications_off', 'notifications_paused', 'bell'), visual: 'a suspended ringing bell with a clapper', usage: 'user notifications, alerts, reminders, and activity feeds', cat: 'notification' },
  { match: (s) => matchTokens(s, 'battery_full', 'battery_charging_full', 'battery_alert', 'battery_unknown', 'battery_saver', 'battery_std', 'battery_profile'), visual: 'a rectangular battery cell indicator with charge level bars and terminal tip', usage: 'battery status indicators, power levels, energy settings, and charging state', cat: 'device' },
  { match: (s) => matchTokens(s, 'wifi', 'wifi_off', 'wifi_password', 'signal_cellular_alt', 'signal_cellular_4_bar', 'network_check', 'network_wifi'), visual: 'radiating concentric arched wave bars emanating from a focal point', usage: 'wireless network connectivity, signal strength indicators, and internet status', cat: 'device' },
  { match: (s) => matchTokens(s, 'bluetooth', 'bluetooth_connected', 'bluetooth_disabled', 'bluetooth_searching', 'bluetooth_drive'), visual: 'the angular geometric rune symbol for Bluetooth wireless', usage: 'Bluetooth pairing, wireless device connections, and peripheral syncing', cat: 'device' },
  { match: (s) => matchTokens(s, 'power_settings_new', 'power_off', 'power'), visual: 'a circular power standby symbol with a vertical break line', usage: 'powering on/off devices, system shutdown, session logout, and standby mode', cat: 'action' },
  { match: (s) => matchTokens(s, 'desktop_windows', 'desktop_mac', 'computer', 'monitor', 'tv'), visual: 'a widescreen computer monitor standing on a desktop pedestal', usage: 'desktop viewport settings, display hardware, and workstation management', cat: 'hardware' },
  { match: (s) => matchTokens(s, 'laptop', 'laptop_chromebook', 'laptop_mac', 'laptop_windows'), visual: 'an opened clamshell laptop notebook computer', usage: 'laptop devices, portable computing, and device switching', cat: 'hardware' },
  { match: (s) => matchTokens(s, 'tablet', 'tablet_android', 'tablet_mac'), visual: 'a flat rectangular touchscreen tablet with bezel borders', usage: 'tablet device previews, mobile touch viewports, and responsive layouts', cat: 'hardware' },
  { match: (s) => matchTokens(s, 'smartphone', 'phone_android', 'phone_iphone', 'mobile_friendly', 'mobile_off'), visual: 'a slim rectangular smartphone with a home indicator or speaker slot', usage: 'mobile devices, phone verification, and mobile viewports', cat: 'hardware' },
  { match: (s) => matchTokens(s, 'keyboard', 'keyboard_alt', 'keyboard_hide'), visual: 'a grid of miniature rectangular keyboard keycaps', usage: 'typing inputs, keyboard shortcuts, virtual keyboards, and hardware input', cat: 'hardware' },
  { match: (s) => matchTokens(s, 'mouse'), visual: 'an ergonomic computer mouse with a center scroll wheel line', usage: 'pointer input controls, cursor settings, and peripheral accessories', cat: 'hardware' },
  { match: (s) => matchTokens(s, 'print', 'print_disabled'), visual: 'a desktop printer device feeding a printed sheet of paper', usage: 'printing physical documents, printer queues, and hard copy export', cat: 'hardware' },

  // Files, Folders & Documents
  { match: (s) => matchTokens(s, 'folder_open'), visual: 'an unfolded file folder showing an accessible interior compartment', usage: 'active directory browsing, open folder trees, and current path displays', cat: 'file' },
  { match: (s) => matchTokens(s, 'folder', 'folder_shared', 'folder_zip', 'snippet_folder'), visual: 'a closed file folder with a top index tab', usage: 'directory navigation, file organization, storage categories, and file managers', cat: 'file' },
  { match: (s) => matchTokens(s, 'description', 'article', 'file_present', 'draft', 'history_edu', 'notes', 'inventory'), visual: 'a rectangular page sheet with a folded top-right corner', usage: 'document files, articles, text notes, and report pages', cat: 'file' },
  { match: (s) => matchTokens(s, 'attach_file', 'attachment'), visual: 'a bent wire paperclip loop', usage: 'attaching files to messages, uploading document attachments, and enclosures', cat: 'action' },
  { match: (s) => matchTokens(s, 'cloud', 'cloud_queue', 'cloud_done', 'cloud_sync', 'cloud_download', 'cloud_upload', 'cloud_off'), visual: 'a fluffy billowing cloud outline curve', usage: 'cloud storage, file synchronization, remote backups, and network status', cat: 'file' },

  // Media & Audio/Visual
  { match: (s) => matchTokens(s, 'play_arrow', 'play_circle', 'play_circle_filled', 'play_disabled'), visual: 'a solid right-pointing triangle play button symbol', usage: 'playing media, starting video/audio streams, and executing tasks', cat: 'av' },
  { match: (s) => matchTokens(s, 'pause', 'pause_circle', 'pause_circle_filled'), visual: 'two vertical parallel bar strokes', usage: 'pausing playback, pausing timers, and temporarily halting tasks', cat: 'av' },
  { match: (s) => matchTokens(s, 'stop', 'stop_circle'), visual: 'a solid square box stop symbol', usage: 'stopping audio/video playback, canceling execution, and halting processes', cat: 'av' },
  { match: (s) => matchTokens(s, 'skip_next', 'fast_forward'), visual: 'a triangle pointing right toward a solid vertical boundary bar', usage: 'skipping to the next track, chapter, or fast forwarding playback', cat: 'av' },
  { match: (s) => matchTokens(s, 'skip_previous', 'fast_rewind'), visual: 'a triangle pointing left toward a solid vertical boundary bar', usage: 'skipping to the previous track, chapter, or rewinding playback', cat: 'av' },
  { match: (s) => matchTokens(s, 'volume_up', 'volume_down', 'volume_mute', 'speaker', 'surround_sound'), visual: 'a speaker cone emitting radiating sound wave arcs', usage: 'volume controls, audio playback, sound settings, and loudspeaker output', cat: 'av' },
  { match: (s) => matchTokens(s, 'volume_off'), visual: 'a speaker cone with sound waves crossed out or muted', usage: 'muting audio, silencing notifications, and quiet mode', cat: 'av' },
  { match: (s) => matchTokens(s, 'mic_off'), visual: 'a studio microphone silhouette with a diagonal slash line', usage: 'muting microphone audio, disabling voice recording, and private mode', cat: 'av' },
  { match: (s) => matchTokens(s, 'mic', 'mic_none'), visual: 'a capsule studio microphone with a stand cradle', usage: 'voice search, recording audio notes, speech input, and podcasting', cat: 'av' },
  { match: (s) => matchTokens(s, 'camera_alt', 'photo_camera', 'camera', 'camera_rear', 'camera_front'), visual: 'a compact camera body with a central circular lens aperture', usage: 'taking photos, capturing images, camera permissions, and media uploads', cat: 'image' },
  { match: (s) => matchTokens(s, 'image', 'photo', 'landscape', 'wallpaper'), visual: 'a rectangular picture frame containing a landscape mountain and sun silhouette', usage: 'photo galleries, image assets, media placeholders, and wallpaper pickers', cat: 'image' },

  // Editor & Typography
  { match: (s) => matchTokens(s, 'format_bold'), visual: 'a heavy bold capital letter B glyph', usage: 'bolding text selection, emphasis styling, and rich text editors', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_italic'), visual: 'a slanted capital letter I glyph', usage: 'italicizing text selection and emphasis styling', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_underlined'), visual: 'a capital letter U with a horizontal underline stroke', usage: 'underlining text selections and hyperlinking indicators', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_align_left'), visual: 'horizontal text lines aligned along the left margin', usage: 'left-aligning paragraphs and text blocks', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_align_center'), visual: 'horizontal text lines symmetrically centered', usage: 'centering text headings, callouts, and paragraphs', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_align_right'), visual: 'horizontal text lines aligned along the right margin', usage: 'right-aligning numbers, arabic text, and margin notes', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_list_bulleted'), visual: 'stacked horizontal text lines preceded by bullet dots', usage: 'creating unordered bullet lists and itemized agendas', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_list_numbered'), visual: 'stacked horizontal text lines preceded by digit numbers (1, 2, 3)', usage: 'creating ordered numbered lists, sequential steps, and rankings', cat: 'editor' },
  { match: (s) => matchTokens(s, 'format_quote'), visual: 'a pair of stylized typographical quotation marks', usage: 'blockquotes, citing authors, customer testimonials, and pull quotes', cat: 'editor' },
  { match: (s) => matchTokens(s, 'table_chart', 'table_rows', 'table_view', 'grid_on'), visual: 'a rectangular grid of partitioned rows and columns', usage: 'data tables, spreadsheet views, matrix layouts, and tabular records', cat: 'editor' },
  { match: (s) => matchTokens(s, 'code', 'code_off', 'html', 'javascript', 'css', 'data_object', 'data_array', 'terminal'), visual: 'opposing angle brackets (< >) with code symbols', usage: 'code snippets, syntax blocks, developer tools, and API integration', cat: 'action' },

  // Places, Maps & Travel
  { match: (s) => matchTokens(s, 'home', 'house', 'home_pin'), visual: 'a suburban house silhouette with a pitched roof and chimney', usage: 'dashboard homepage, main navigation, home address, and property views', cat: 'action' },
  { match: (s) => matchTokens(s, 'pin_drop', 'location_on', 'location_pin', 'push_pin', 'globe_location_pin'), visual: 'a teardrop map pin marker or folded geographic map sheet', usage: 'geolocation, map markers, location selection, and spatial navigation', cat: 'maps' },
  { match: (s) => matchTokens(s, 'flight', 'flight_takeoff', 'flight_land', 'airplane_ticket', 'connecting_airports'), visual: 'a top-down silhouette of a passenger commercial jet airplane', usage: 'airline flights, travel bookings, airport transit, and airplane mode', cat: 'maps' },
  { match: (s) => matchTokens(s, 'directions_car', 'car_rental', 'car_repair', 'car_crash', 'electric_car'), visual: 'a front-facing passenger automobile sedan silhouette', usage: 'driving directions, vehicle fleet management, parking, and automotive services', cat: 'maps' },
  { match: (s) => matchTokens(s, 'restaurant', 'restaurant_menu', 'local_dining', 'dining', 'lunch_dining', 'dinner_dining'), visual: 'a crossed fork and knife dining utensil pair', usage: 'restaurants, food ordering menus, meal plans, and dining venues', cat: 'places' },
  { match: (s) => matchTokens(s, 'hotel', 'bed', 'single_bed', 'king_bed', 'bedroom_parent'), visual: 'a bedroom sleeping mattress with pillows and headboard', usage: 'hotel accommodations, lodging reservations, overnight stays, and sleep settings', cat: 'places' },
  { match: (s) => matchTokens(s, 'local_cafe', 'coffee', 'coffee_maker'), visual: 'a steaming hot coffee or tea mug on a saucer', usage: 'cafes, coffee breaks, beverage menus, and refreshments', cat: 'places' },

  // Nature, Weather & Science
  { match: (s) => matchTokens(s, 'wb_sunny', 'light_mode', 'sunny', 'brightness_high', 'brightness_medium'), visual: 'a central solar disk surrounded by radiating sun rays', usage: 'light mode theme toggles, screen brightness controls, and daylight settings', cat: 'image' },
  { match: (s) => matchTokens(s, 'bedtime', 'dark_mode', 'nights_stay', 'nightlight', 'mode_night'), visual: 'a slender crescent moon curve', usage: 'dark mode theme toggles, night mode settings, and sleep schedules', cat: 'image' },
  { match: (s) => matchTokens(s, 'ac_unit', 'snowflake', 'severe_cold'), visual: 'a six-pointed symmetrical snowflake motif with radial branched arms', usage: 'air conditioning, climate cooling, winter settings, and refrigeration', cat: 'places' },
  { match: (s) => matchTokens(s, 'thermostat', 'device_thermostat'), visual: 'a tall slender mercury thermometer tube with a bottom bulb', usage: 'temperature readings, climate control, HVAC sensors, and weather apps', cat: 'device' },
  { match: (s) => matchTokens(s, 'water_drop', 'water', 'opacity'), visual: 'a pear-shaped liquid water droplet', usage: 'humidity levels, liquid measurements, water conservation, and rain forecasts', cat: 'places' },
  { match: (s) => matchTokens(s, 'eco', 'compost', 'recycling', 'forest', 'nature'), visual: 'a delicate organic botanical leaf with a center vein', usage: 'ecological sustainability, green initiatives, energy savings, and nature themes', cat: 'places' },
  { match: (s) => matchTokens(s, 'science', 'biotech', 'experiment', 'chemistry'), visual: 'a laboratory chemistry Erlenmeyer flask with liquid measurements', usage: 'scientific research, experimental beta features, laboratory testing, and chemistry', cat: 'places' },
  { match: (s) => matchTokens(s, 'local_hospital', 'medical_services', 'medication', 'medication_liquid', 'vaccines', 'syringe', 'emergency', 'first_aid'), visual: 'a symmetrical first-aid plus cross or medicine bottle', usage: 'hospitals, emergency healthcare, pharmaceutical prescriptions, and medical records', cat: 'places' },
]

// Common synonym dictionaries for specific terms
const SYNONYM_EXTENSIONS = {
  delete: ['trash', 'bin', 'garbage', 'rubbish', 'remove', 'clear', 'discard', 'erase', 'purge', 'destroy'],
  edit: ['pencil', 'pen', 'modify', 'update', 'write', 'change', 'revise', 'draft', 'author'],
  search: ['magnifying glass', 'find', 'lookup', 'explore', 'query', 'filter', 'inspect', 'seek', 'scan'],
  close: ['cross', 'exit', 'dismiss', 'x', 'cancel', 'shut', 'close dialog'],
  settings: ['gear', 'cog', 'wheel', 'config', 'preferences', 'setup', 'options', 'admin', 'properties'],
  add: ['plus', 'create', 'new', 'insert', 'append', 'attach', 'more'],
  remove: ['minus', 'subtract', 'delete', 'exclude', 'collapse', 'less'],
  check: ['tick', 'done', 'complete', 'success', 'valid', 'confirm', 'verify', 'ok'],
  home: ['house', 'main', 'start', 'dashboard', 'landing', 'homepage', 'root'],
  menu: ['hamburger', 'drawer', 'navigation', 'sidebar', 'options', 'list', 'lines'],
  user: ['person', 'account', 'profile', 'member', 'avatar', 'individual', 'author', 'human'],
  users: ['people', 'team', 'group', 'community', 'collaborators', 'members', 'organization'],
  lock: ['padlock', 'security', 'secure', 'protect', 'private', 'password', 'restricted'],
  unlock: ['open', 'unsecured', 'public', 'access', 'grant', 'allow', 'permit'],
  folder: ['directory', 'binder', 'storage', 'archive', 'filesystem', 'catalog'],
  file: ['document', 'sheet', 'page', 'record', 'article', 'note', 'text'],
  mail: ['envelope', 'email', 'message', 'inbox', 'letter', 'postal', 'dispatch'],
  phone: ['call', 'telephone', 'dialer', 'contact', 'mobile', 'handset', 'support'],
  chat: ['message', 'comment', 'bubble', 'talk', 'conversation', 'discuss', 'feedback'],
  image: ['photo', 'picture', 'graphic', 'photograph', 'camera', 'visual', 'art'],
  video: ['movie', 'clip', 'film', 'recording', 'footage', 'stream', 'play'],
  audio: ['sound', 'music', 'track', 'volume', 'speaker', 'listening', 'hearing'],
  download: ['save', 'export', 'fetch', 'receive', 'offline', 'load down'],
  upload: ['publish', 'import', 'send', 'cloud', 'push', 'submit', 'load up'],
  refresh: ['reload', 'sync', 'renew', 'update', 'repeat', 'recalculate'],
  visibility: ['eye', 'view', 'show', 'preview', 'reveal', 'see', 'watch', 'display'],
  visibility_off: ['hide', 'conceal', 'mask', 'hidden', 'invisible', 'cover', 'blind'],
  money: ['cash', 'currency', 'dollar', 'payment', 'finance', 'cost', 'funds', 'price'],
  wallet: ['purse', 'funds', 'billfold', 'crypto', 'stored value', 'cards', 'balance'],
  cart: ['basket', 'trolley', 'shopping', 'store', 'checkout', 'buy', 'purchase', 'order'],
  map: ['location', 'pin', 'place', 'gps', 'navigation', 'directions', 'geo', 'marker'],
  warning: ['alert', 'danger', 'caution', 'exclamation', 'notice', 'issue', 'attention'],
  error: ['problem', 'failure', 'cross', 'bug', 'wrong', 'bad', 'invalid'],
  help: ['support', 'question', 'info', 'faq', 'guide', 'assist', 'tip', 'advice'],
  star: ['favorite', 'rating', 'bookmark', 'score', 'featured', 'review', 'priority'],
  heart: ['like', 'love', 'favorite', 'health', 'pulse', 'vital', 'wishlist'],
  code: ['developer', 'terminal', 'html', 'syntax', 'programming', 'script', 'source'],
  link: ['url', 'hyperlink', 'chain', 'connect', 'attachment', 'web'],
}

function cleanSlug(jsxName) {
  let raw = jsxName.replace(/Icon$/, '')
  if (/^Icon\d/.test(jsxName)) {
    raw = raw.replace(/^Icon/, '')
  }
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/_+/g, '_')
    .toLowerCase()
}

function humanizeName(jsxName) {
  let raw = jsxName.replace(/Icon$/, '')
  if (/^Icon\d/.test(jsxName)) {
    raw = raw.replace(/^Icon/, '')
  }
  return raw.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

function generateDescription(jsxName, slug, categories, tags) {
  const readable = slug.replace(/_/g, ' ')
  const nameTitle = humanizeName(jsxName)

  // 1. Check exact slug matches first
  for (const motif of VISUAL_MOTIFS) {
    if (motif.exact && motif.exact.includes(slug)) {
      return `${nameTitle} icon showing ${motif.visual}. Used for ${motif.usage}.`
    }
  }

  // 2. Modifiers and compound actions detection
  const isOff = slug.endsWith('_off') || slug.includes('_off_')
  const isAdd = slug.startsWith('add_') || slug.endsWith('_add') || slug.endsWith('_plus')
  const isRemove = slug.startsWith('remove_') || slug.endsWith('_remove') || slug.endsWith('_minus')
  const isCheck = slug.endsWith('_check') || slug.endsWith('_done') || slug.endsWith('_verified')
  const isLock = slug.endsWith('_lock') || slug.includes('_lock')
  const isAlert = slug.endsWith('_alert') || slug.endsWith('_warning')

  let baseSubject = readable
    .replace(/^(add|remove|delete|insert|create) /, '')
    .replace(/ (off|add|plus|remove|minus|check|done|lock|alert|warning|verified)$/, '')
    .trim()

  if (isOff) {
    return `${nameTitle} icon showing a ${baseSubject} motif crossed out with a diagonal slash line. Used for disabling, turning off, or indicating inactive ${baseSubject} state.`
  }
  if (isAdd && slug !== 'add' && slug !== 'add2' && slug !== 'plus_one') {
    return `${nameTitle} icon showing a ${baseSubject} visual motif paired with an overlaid plus (+) sign. Used for creating, adding, or attaching new ${baseSubject} records.`
  }
  if (isRemove && slug !== 'remove') {
    return `${nameTitle} icon showing a ${baseSubject} visual motif paired with an overlaid minus (-) sign. Used for removing, deleting, or subtracting ${baseSubject} elements.`
  }
  if (isCheck && slug !== 'check' && slug !== 'done') {
    return `${nameTitle} icon showing a ${baseSubject} visual motif accompanied by a validation checkmark tick. Used for confirming, verifying, or marking completed ${baseSubject} items.`
  }
  if (isLock && slug !== 'lock') {
    return `${nameTitle} icon showing a ${baseSubject} visual motif secured by a closed padlock emblem. Used for restricted, password-protected, or secured ${baseSubject} operations.`
  }
  if (isAlert && slug !== 'alert' && slug !== 'warning') {
    return `${nameTitle} icon showing a ${baseSubject} visual motif accompanied by an alert exclamation badge. Used for warning notices, critical alerts, and status notifications for ${baseSubject}.`
  }

  // 3. Motif pattern matching
  for (const motif of VISUAL_MOTIFS) {
    if (motif.match && (motif.match(slug) || motif.match(cleanSlug(jsxName)))) {
      return `${nameTitle} icon showing ${motif.visual}. Used for ${motif.usage}.`
    }
  }

  // 4. Smart contextual fallback
  const cleanTags = tags
    .filter(t => t.toLowerCase() !== 'symbols' && t.toLowerCase() !== readable && t.length > 2)
    .slice(0, 4)

  const usageContext = cleanTags.length > 0
    ? `${cleanTags.join(', ')} controls, status indicators, and UI triggers`
    : `${readable} actions, navigation triggers, and interface states`

  return `${nameTitle} icon depicting a clear ${readable} symbol. Used for ${usageContext}.`
}

async function main() {
  console.log('Fetching Material Symbols & Google metadata...')
  const [svgRes, googleRes] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/npm/@material-symbols-svg/metadata@latest/icon-index.json'),
    fetch('https://fonts.google.com/metadata/icons').catch(() => null),
  ])

  if (!svgRes.ok) {
    throw new Error(`Failed to fetch @material-symbols-svg metadata: ${svgRes.statusText}`)
  }
  const rawSvg = await svgRes.json()

  let rawGoogleIcons = []
  if (googleRes && googleRes.ok) {
    const text = await googleRes.text()
    try {
      rawGoogleIcons = JSON.parse(text.replace(/^\)\]\}\x27\n/, '')).icons || []
    } catch {
      rawGoogleIcons = []
    }
  }

  const { ICON_JSX_NAMES } = await import(jsxNamesPath)

  // Map indexes
  const bySlugSvg = new Map()
  const byCleanSvg = new Map()
  for (const [slug, item] of Object.entries(rawSvg)) {
    bySlugSvg.set(slug.toLowerCase(), item)
    byCleanSvg.set(slug.replace(/[^a-z0-9]/gi, '').toLowerCase(), item)
    if (item.name) {
      bySlugSvg.set(item.name.toLowerCase(), item)
      byCleanSvg.set(item.name.replace(/[^a-z0-9]/gi, '').toLowerCase(), item)
    }
  }

  const byCleanGoogle = new Map()
  for (const item of rawGoogleIcons) {
    byCleanGoogle.set(item.name.replace(/[^a-z0-9]/gi, '').toLowerCase(), item)
  }

  const result = {}

  for (const jsxName of ICON_JSX_NAMES) {
    let raw = jsxName.replace(/Icon$/, '')
    if (/^Icon\d/.test(jsxName)) {
      raw = raw.replace(/^Icon/, '')
    }
    const clean = raw.replace(/[^a-z0-9]/gi, '').toLowerCase()
    const itemSvg = byCleanSvg.get(clean) || bySlugSvg.get(raw.toLowerCase())
    const itemGoogle = byCleanGoogle.get(clean)

    const slug = itemSvg?.name || itemGoogle?.name || cleanSlug(jsxName)
    
    // Categories
    const catSet = new Set()
    if (itemSvg?.categories) {
      itemSvg.categories.filter(c => c !== 'symbols').forEach(c => catSet.add(c))
    }
    if (itemGoogle?.categories) {
      itemGoogle.categories.forEach(c => catSet.add(c))
    }

    // Motif-based category enhancement
    for (const motif of VISUAL_MOTIFS) {
      if (motif.cat) {
        if (motif.exact && motif.exact.includes(slug)) {
          catSet.add(motif.cat)
          break
        } else if (motif.match && (motif.match(slug) || motif.match(cleanSlug(jsxName)))) {
          catSet.add(motif.cat)
          break
        }
      }
    }

    if (catSet.size === 0) catSet.add('action')
    const categories = Array.from(catSet)

    // Keywords / Tags
    const tagSet = new Set()
    if (itemSvg?.searchTerms) {
      itemSvg.searchTerms.filter(t => t !== 'symbols').forEach(t => tagSet.add(t.toLowerCase()))
    }
    if (itemGoogle?.tags) {
      itemGoogle.tags.forEach(t => tagSet.add(t.toLowerCase()))
    }

    // Name tokens
    tagSet.add(slug.replace(/_/g, ' '))
    tagSet.add(slug.replace(/_/g, ''))
    tagSet.add(humanizeName(jsxName).toLowerCase())
    // Synonym extensions
    for (const [rootWord, syns] of Object.entries(SYNONYM_EXTENSIONS)) {
      if (slug.includes(rootWord) || jsxName.toLowerCase().includes(rootWord)) {
        syns.forEach(s => tagSet.add(s))
      }
    }

    // Core prioritized synonyms for primary UI icons
    const priorityList = []
    if (slug === 'edit' || slug === 'mode_edit') {
      priorityList.push('pencil', 'pen', 'modify', 'update', 'write', 'change')
    } else if (slug === 'delete' || slug === 'delete_forever') {
      priorityList.push('trash', 'bin', 'garbage', 'rubbish', 'remove', 'clear', 'discard', 'erase')
    } else if (slug === 'search') {
      priorityList.push('magnifying glass', 'find', 'lookup', 'query', 'explore')
    } else if (slug === 'close' || slug === 'cancel') {
      priorityList.push('cross', 'exit', 'dismiss', 'x', 'cancel')
    } else if (slug === 'settings' || slug === 'gear') {
      priorityList.push('gear', 'cog', 'config', 'preferences', 'setup', 'options')
    }

    const tags = Array.from(new Set([...priorityList, ...tagSet]))
    const description = generateDescription(jsxName, slug, categories, tags)

    result[jsxName] = {
      name: jsxName,
      slug,
      categories,
      tags,
      description,
    }
  }

  // Format with 2 spaces for human inspection
  const jsonStr = JSON.stringify(result, null, 2)
  await writeFile(targetJsonPath, jsonStr, 'utf8')
  console.log(`Successfully generated ${Object.keys(result).length} enhanced icon metadata entries at ${targetJsonPath} (${(jsonStr.length / (1024 * 1024)).toFixed(2)} MB)`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})



