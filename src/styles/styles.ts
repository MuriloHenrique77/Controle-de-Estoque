import { setStatusBarBackgroundColor } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

export default StyleSheet.create({

    /* Home Screen styles */
    homeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 40,
    },  
    /* Modal styles */

    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    closeButton: {
        marginTop: 12,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 8,
    },
    closeText: {
        color: '#fff',
        fontSize: 14,
    },
    modalChildText: {
        textAlign: 'center',
    },

    //Vendas Salvas Container
    vendasContainer: {
    marginTop: 20,
    },

    vendasTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    },

    vendaCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    },

    vendaNome: {
    fontWeight: 'bold',
    },

    vendaTexto: {
    fontSize: 14,
    color: '#111',
    },
    vendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    },

    acoesContainer: {
    flexDirection: 'row',
    gap: 8,
    },

    acaoBotao: {
    padding: 6,
    borderRadius: 6,
    },

        


});