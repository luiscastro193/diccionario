#include<string>
#include<vector>
#include<unordered_set>
#include<fstream>
#include<iostream>
#include<ctype.h>
using namespace std;

bool GetSiguiente(string &palabra, ifstream &archivo){
	bool letra_encontrada = false;
	char leido;
	palabra.clear();
	
	while( archivo.get(leido) ){
		if( isalpha(leido) ){
			letra_encontrada = true;
			palabra.push_back( tolower(leido) );
		}
		else if(letra_encontrada){
			if( leido == '-' and archivo.get(leido) and isalpha(leido) ){
				palabra.push_back('-');
				palabra.push_back(leido);
			}
			else
				return true;
		}
	}
	
	return letra_encontrada;
}

void AniadirPalabras(unordered_set<string> &diccionario, char *ruta_de_archivo){
	ifstream archivo(ruta_de_archivo);
	string palabra;
	
	while( GetSiguiente(palabra, archivo) )
		diccionario.insert(palabra);
	archivo.close();
}

// Devuelve el numero de ocurrencias.
int BuscarCadena(const string &buscado, const unordered_set<string> &diccionario, vector<string> &encontradas){
	int numero_ocurrencias = 0;
	encontradas.clear();
	
	for(const auto &entrada : diccionario){
		if(entrada.find(buscado) != string::npos){
			++numero_ocurrencias;
			encontradas.push_back(entrada);
		}
	}
	
	return numero_ocurrencias;
}

// El numero de opciones no puede salirse de los limites del vector.
void ImprimirOpciones(const vector<string> &posibilidades, int numero_opciones){
	for(int i = 0; i < numero_opciones; ++i){
		cout << posibilidades[i] << " (" << i << ")\n";
	}
}

// El indice no puede salirse de los limites del vector.
void ImprimirLinks(const vector<string> &opciones, int indice = 0){
	system( ("firefox http://www.wordreference.com/enes/" + opciones[indice] + " > /dev/null 2>&1 &").c_str() );
	cout << "Links:\n"
		  << "http://www.wordreference.com/enes/" << opciones[indice] << endl
		  << "http://www.oxforddictionaries.com/search/english-spanish/?q=" << opciones[indice] << endl
		  << "http://www.oxforddictionaries.com/search?q=" << opciones[indice] << endl
		  << "http://www.urbandictionary.com/define.php?term=" << opciones[indice] << endl;
}

int main(int argc, char *argv[]){
	if (argc != 2){
		cout << "Pase el nombre del archivo como argumento.\n";
		return -1;
	}
	
	unordered_set<string> diccionario; 
	vector<string> encontradas;
	string buscado;
	string clave_finalizacion("exit");
	int numero_ocurrencias, indice_elegido;
	AniadirPalabras(diccionario, argv[1]);
	
	cout << "Introduzca la cadena a buscar: ";
	cin >> buscado;
	
	while(buscado != clave_finalizacion){
		numero_ocurrencias = BuscarCadena(buscado, diccionario, encontradas);
		if(numero_ocurrencias == 1)
			ImprimirLinks(encontradas);
		else if(numero_ocurrencias > 1){
			cout << "Elija una opcion:\n";
			ImprimirOpciones(encontradas, numero_ocurrencias);
			do{
				cout << "Indice elegido: ";
				cin >> indice_elegido;
				if( cin.fail() ){
					cin.clear();
					cin.ignore();
					indice_elegido = -1;
				}
			}while(indice_elegido < 0 or indice_elegido >= numero_ocurrencias);
			ImprimirLinks(encontradas, indice_elegido);
		}
		else
			cout << "No encontrada.\n";
		
		cout << "Introduzca la cadena a buscar: ";
		cin >> buscado;
	}
}
