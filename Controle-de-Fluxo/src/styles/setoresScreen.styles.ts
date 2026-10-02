import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },

  newButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  newButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  listContent: {
    paddingBottom: 20,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  cardMainArea: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },

  cardDescription: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },

  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 4,
  },

  actionButton: {
    padding: 10,
    borderRadius: 10,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  emptyButton: {
    marginTop: 20,
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  emptyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});