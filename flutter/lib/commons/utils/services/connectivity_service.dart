import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity;

  ConnectivityService({required Connectivity connectivity})
      : _connectivity = connectivity;

  Future<bool> isConnected() async {
    try {
      var connectivityResult = await _connectivity.checkConnectivity();
      return connectivityResult.any((result) {
        return result == ConnectivityResult.mobile ||
            result == ConnectivityResult.wifi ||
            result == ConnectivityResult.ethernet;
      });
    } catch (e) {
      return false;
    }
  }

  Stream<List<ConnectivityResult>> onConnectivityChanged() {
    return _connectivity.onConnectivityChanged;
  }

  bool isOfflineFromResults(List<ConnectivityResult> results) {
    return !results.any((result) =>
        result == ConnectivityResult.mobile ||
        result == ConnectivityResult.wifi ||
        result == ConnectivityResult.ethernet);
  }
}
