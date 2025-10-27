import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:trees_india/commons/components/main_layout/app/views/main_layout_widget.dart';
import 'package:trees_india/commons/components/snackbar/app/views/info_snackbar_widget.dart';
import 'package:trees_india/commons/components/text/app/views/custom_text_library.dart';
import 'package:trees_india/commons/constants/app_colors.dart';
import 'package:trees_india/commons/app/route_tracker.dart';
import 'package:trees_india/commons/mixins/connectivity_refresh_mixin.dart';
import 'package:trees_india/pages/chats_page/app/viewmodels/conversations_notifier.dart';
import '../viewmodels/conversations_state.dart';
import '../providers/conversations_provider.dart';
import 'widgets/conversation_card.dart';

class ConversationsPage extends ConsumerStatefulWidget {
  const ConversationsPage({super.key});

  @override
  ConsumerState<ConversationsPage> createState() => _ConversationsPageState();
}

class _ConversationsPageState extends ConsumerState<ConversationsPage>
    with WidgetsBindingObserver, ConnectivityRefreshMixin {
  final ScrollController _scrollController = ScrollController();
  bool _isInitialized = false;
  late NavigationCallback _navigationCallback;
  late ConversationsNotifier _notifier;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addObserver(this);

    // Set up navigation callback for auto-refresh control and refresh when returning
    _navigationCallback = (String from, String to, bool isPop) {
      final notifier = ref.read(conversationsNotifierProvider.notifier);

      if (isPop &&
          from.startsWith('ConversationPage') &&
          to == 'ConversationsPage') {
        // User returned from a conversation to conversations page - refresh and restart auto-refresh
        debugPrint(
            '🔄 Returning to conversations: refreshing list and restarting auto-refresh');
        if (mounted) {
          notifier.loadConversations(refresh: true);
          notifier.startAutoRefresh();
        }
      } else if (!isPop &&
          from == 'ConversationsPage' &&
          to.startsWith('ConversationPage')) {
        // User navigated from conversations page to a conversation - stop auto-refresh
        debugPrint('⏸️ Navigating to conversation: stopping auto-refresh');
        notifier.stopAutoRefresh();
      }
    };
    addNavigationCallback(_navigationCallback);

    // Load conversations when page is first loaded and start auto-refresh
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifier = ref.read(conversationsNotifierProvider.notifier);
      _notifier.loadConversations(refresh: true);
      _notifier.startAutoRefresh();
      _isInitialized = true;
    });
  }

  // Removed didChangeDependencies() - now using navigation callback system

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Refresh conversations when app comes back to foreground
    if (state == AppLifecycleState.resumed && mounted && _isInitialized) {
      ref
          .read(conversationsNotifierProvider.notifier)
          .loadConversations(refresh: true);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    removeNavigationCallback(_navigationCallback);
    _notifier.stopAutoRefresh();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      ref.read(conversationsNotifierProvider.notifier).loadMoreConversations();
    }
  }

  @override
  Widget build(BuildContext context) {
    final conversationsState = ref.watch(conversationsNotifierProvider);

    return MainLayoutWidget(
      currentIndex: 2,
      child: Scaffold(
        appBar: AppBar(
          title: H3Bold(
            text: 'Chats',
            color: AppColors.brandNeutral800,
          ),
          backgroundColor: AppColors.brandNeutral50,
          elevation: 0,
          automaticallyImplyLeading: false,
        ),
        body: _buildBody(conversationsState),
      ),
    );
  }

  Widget _buildBody(ConversationsState state) {
    switch (state.status) {
      case ConversationsStatus.initial:
      case ConversationsStatus.loading:
        return const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF055c3a),
          ),
        );

      case ConversationsStatus.error:
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'Failed to load chats',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                state.errorMessage ?? 'Unknown error occurred',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  ref
                      .read(conversationsNotifierProvider.notifier)
                      .loadConversations(refresh: true);
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        );

      case ConversationsStatus.loaded:
      case ConversationsStatus.loadingMore:
      case ConversationsStatus.refreshing:
        if (state.conversations.isEmpty) {
          return _buildEmptyState();
        }
        return _buildConversationList(state);
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No chats yet',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your chat conversations will appear here',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildConversationList(ConversationsState state) {
    // RefreshIndicator handles the pull-to-refresh loading state
    // It shows its native loading indicator when refreshing
    return RefreshIndicator(
      onRefresh: () async {
        ref.read(conversationsNotifierProvider.notifier).refreshConversations();
      },
      child: ListView.builder(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        // Add extra item for loading more indicator when fetching more conversations
        itemCount: state.conversations.length +
            (state.status == ConversationsStatus.loadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          // Show loading indicator at the bottom when loading more conversations
          if (index >= state.conversations.length) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Theme.of(context).primaryColor.withOpacity(0.7),
                    ),
                  ),
                ),
              ),
            );
          }

          final conversation = state.conversations[index];
          return ConversationCard(conversation: conversation);
        },
      ),
    );
  }

  @override
  void onConnectivityRestored() {
    // This is called automatically when connectivity is restored
    _refreshPageData();
  }

  void _refreshPageData() {
    // Reload all page data when connectivity is restored
    try {
      ref
          .read(conversationsNotifierProvider.notifier)
          .loadConversations(refresh: true);
    } catch (e) {
      debugPrint('Error refreshing page data: $e');
    }
  }
}
