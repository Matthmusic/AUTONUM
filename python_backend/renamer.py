"""
AutoNUM Backend - Renommage automatique de fichiers
Logique Python pour le renommage en lot
"""
import argparse
import json
import os
import shutil
import sys
from pathlib import Path


def rename_files(files, output_folder, prefix, start_number, move_mode=False):
    """
    Renomme les fichiers avec le préfixe et la numérotation

    Args:
        files: Liste des chemins de fichiers à renommer
        output_folder: Dossier de destination
        prefix: Préfixe pour les nouveaux noms
        start_number: Numéro de départ
        move_mode: Si True, déplace les fichiers. Si False, les copie (défaut)

    Returns:
        Dict avec success (count) et errors (list)
    """
    success = 0
    errors = []

    # Créer le dossier de sortie si nécessaire
    os.makedirs(output_folder, exist_ok=True)

    for i, file_path in enumerate(files):
        try:
            if not os.path.isfile(file_path):
                errors.append(f"{file_path}: Fichier introuvable")
                continue

            # Générer le nouveau nom
            ext = Path(file_path).suffix
            number = start_number + i
            new_name = f"{prefix}_{number:03d}{ext}"
            new_path = os.path.join(output_folder, new_name)

            # Copier ou déplacer le fichier
            if move_mode:
                shutil.move(file_path, new_path)
            else:
                shutil.copy2(file_path, new_path)
            success += 1

        except Exception as e:
            errors.append(f"{Path(file_path).name}: {str(e)}")

    return {
        "success": success,
        "errors": errors
    }


def main():
    parser = argparse.ArgumentParser(description='AutoNUM - Renommage de fichiers')
    parser.add_argument('--files', type=str, required=True, help='Liste JSON des fichiers')
    parser.add_argument('--output', type=str, required=True, help='Dossier de sortie')
    parser.add_argument('--prefix', type=str, required=True, help='Préfixe des fichiers')
    parser.add_argument('--start', type=int, required=True, help='Numéro de départ')
    parser.add_argument('--move', action='store_true', help='Déplacer au lieu de copier')

    args = parser.parse_args()

    try:
        files = json.loads(args.files)
        result = rename_files(files, args.output, args.prefix, args.start, args.move)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
