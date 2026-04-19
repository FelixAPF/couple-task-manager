import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { SharedModule } from '../../shared.module';
import { Subscription, throwError } from 'rxjs';
import { switchMap, catchError, finalize, tap } from 'rxjs/operators';

// --- Import your services and models ---
import { RecipeService } from '../../service/recipe.service'; 
import { FileService } from '../../service/file-upload.service'; 
import { Recipe, Ingredient, RecipeType } from '../../model/recipes'; 
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { TranslateService } from '@ngx-translate/core';
import { InputNumberModule } from 'primeng/inputnumber';

interface RecipeTypeOption {
  label: string;
  value: string;
}

interface FileUploadResponse {
  url?: string;       
  fileURL?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-recipe-creation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    ToastModule,
    InputTextModule,
    InputNumberModule,
    FormsModule,
    TextareaModule,
    DropdownModule,
    ButtonModule
  ],
  templateUrl: './recipe-creation.component.html',
  styleUrls: ['./recipe-creation.component.css'], 
  providers: [MessageService]
})
export class RecipeCreationComponent implements OnInit, OnDestroy {
  readonly maxFileSizeInMb = 100;

  recipeForm!: FormGroup;
  isEditMode = false; 
  recipeToEdit?: Recipe;
  recipeTypes: RecipeTypeOption[] = [];

  isScanning = false;
  isGeneratingImage: boolean = false; 

  importOptions: any[] = [
      { label: 'Image', value: 'image', icon: 'pi pi-image' },
      { label: 'Lien / Vidéo', value: 'url', icon: 'pi pi-link' }
  ];

  importUrl: string = '';
  selectedFile: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  initialImageUrl: string | null = null;
  private _importMode: string = 'image';
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    private fileService: FileService,
    private messageService: MessageService,
    private translateService: TranslateService,
    private dialogRef: DynamicDialogRef,
    private config: DynamicDialogConfig,
    private cdRef: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    this.recipeToEdit = this.config.data?.recipe;
    this.isEditMode = !!this.recipeToEdit;
    this.initForm();
    this.recipeTypes = Object.keys(RecipeType).map(key => ({ 
      label: this.translateService.instant(`RECIPE_CATEGORY.${key}`), 
      value: key 
    }));

    if (this.isEditMode && this.recipeToEdit) {
      this.loadRecipeData(this.recipeToEdit);
    } else {
      this.addIngredient();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get importMode(): string {
      return this._importMode;
  }

  set importMode(value: string) {
      if (value) {
          this._importMode = value;
      }
  }

  // --- Form Initialization and Management ---

  private initForm(): void {
    this.recipeForm = this.fb.group({
      id: [null],  
      name: ['', Validators.required],
      category: [null, Validators.required],
      description: [''],
      basePortionRatio: [null as number | null], 
      imageUrl: [null],
      ingredients: this.fb.array([])
    });
  }

  get recipeName(): string {
    return this.recipeForm.get("name")?.value || '';
  }

  private loadRecipeData(recipe: Recipe): void {
    this.recipeForm.patchValue({
      id: recipe.id, 
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      basePortionRatio: recipe.basePortionRatio,
      imageUrl: recipe.imageUrl
    });
  
    this.initialImageUrl = recipe.imageUrl || null;
    this.ingredients.clear();
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      recipe.ingredients.forEach((ingredient: Ingredient) => {
        this.ingredients.push(this.createIngredientGroup(ingredient));
      });
    } else {
      this.addIngredient();
    }
  }

  // --- AI Image Generation ---

  generateAIImage(): void {
    if (!this.recipeName || this.recipeName.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Nom manquant', detail: 'Veuillez entrer le nom de la recette.' });
      return;
    }
    
    this.isGeneratingImage = true;
    
    this.recipeService.generateSingleAIImage(this.recipeName).subscribe({
      next: (res: any) => {
        this.recipeForm.get("imageUrl")?.setValue(res.imageUrl); 
        this.isGeneratingImage = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Image générée et sauvegardée sur le serveur !' });
      },
      error: () => {
        this.isGeneratingImage = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de générer l\'image.' });
      }
    });
  }

  // --- Smart Import ---

  onUrlImport() {
    if (!this.importUrl) return;

    this.isScanning = true;
    this.messageService.add({ severity: 'info', summary: 'Analyse', detail: 'Récupération de la recette en ligne...' });

    this.recipeService.smartImportUrl(this.importUrl).subscribe({
      next: (recipeData) => {
        this.populateForm(recipeData);
        this.isScanning = false;
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Recette importée !' });
        this.importUrl = ''; 
      },
      error: (err) => {
        console.error(err);
        this.isScanning = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de lire ce lien.' });
      }
    });
  }

  onSmartImport(event: any) {
    const file = event.files[0];
    if (!file) return;

    this.isScanning = true;

    this.recipeService.smartImport(file).subscribe({
      next: (recipeData) => {
        this.populateForm(recipeData);
        this.isScanning = false;
      },
      error: (err) => {
        console.error(err);
        this.isScanning = false;
      }
    });
  }

  populateForm(data: Recipe) {
    this.recipeForm.patchValue({
      name: data.name,
      description: data.description,
      basePortionRatio: data.basePortionRatio,
      imageUrl: data.imageUrl,
      category: data.category
    });

    const ingredientsArray = this.recipeForm.get('ingredients') as FormArray;
    ingredientsArray.clear();

    if (data.ingredients) {
      data.ingredients.forEach(ing => {
        ingredientsArray.push(this.fb.group({
          name: [ing.name, Validators.required],
          quantity: [ing.quantity],
          unit: [ing.unit]
        }));
      });
    }
  }

  // --- Ingredient Management ---

  get ingredients(): FormArray {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  createIngredientGroup(ingredient?: Ingredient): FormGroup {
    return this.fb.group({
      name: [ingredient?.name || '', Validators.required],
      quantity: [ingredient?.quantity || ''], 
      unit: [ingredient?.unit || '']
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    } else {
        this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Une recette doit contenir au moins un ingrédient.' });
    }
  }

  // --- Image Upload Handling ---

  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files ? target.files[0] : null;

    if (!file) {
      this.removeImage();
      return;
    }

    if (!file.type.startsWith('image/')) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez sélectionner un fichier image valide.' });
        return;
    }
    const maxSize = this.maxFileSizeInMb * 1024 * 1024;
    if (file.size > maxSize) {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `La taille du fichier ne doit pas dépasser ${this.maxFileSizeInMb} Mo.` });
        return;
    }

    this.selectedFile = file;
    this.recipeForm.get('imageUrl')?.setValue(null); // Clear form URL

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviewUrl = e.target.result;
      this.cdRef.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.recipeForm.get('imageUrl')?.setValue(null); 
    this.cdRef.detectChanges(); 
  }

  // --- Form Submission ---

  onSubmit(): void {
    this.recipeForm.markAllAsTouched(); 

    if (this.recipeForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Veuillez remplir tous les champs requis.' });
      return;
    } 

    const uploadNeeded = !!this.selectedFile;
    const recipeData = { ...this.recipeForm.value }; 

    const operation$ = uploadNeeded
      ? this.fileService.postFile(this.selectedFile!).pipe(
          tap(uploadResponse => {
            let uploadedUrl: string | undefined;

            if (typeof uploadResponse === 'string') {
              uploadedUrl = uploadResponse;
            } else if (typeof uploadResponse === 'object' && uploadResponse !== null) {
              const typedResponse = uploadResponse as FileUploadResponse; 
              uploadedUrl = typedResponse?.url || typedResponse?.fileURL || typedResponse?.imageUrl;
            }

            if (!uploadedUrl || typeof uploadedUrl !== 'string') {
                throw new Error("L'URL de l'image n'a pas pu être récupérée après l'upload.");
            }

            recipeData.imageUrl = uploadedUrl; 
            this.imageUrl?.setValue(uploadedUrl, { emitEvent: false }); 
          }),
          switchMap(() => this.saveOrUpdateRecipe(recipeData)), 
          catchError(uploadError => {
            console.error('Upload or URL extraction failed:', uploadError);
            const detailMessage = uploadError instanceof Error ? uploadError.message : "Échec de l'envoi de l'image.";
            this.messageService.add({ severity: 'error', summary: 'Erreur Upload', detail: detailMessage });
            return throwError(() => uploadError); 
          })
        )
      : this.saveOrUpdateRecipe(recipeData); 

    this.subscriptions.add(
      operation$.pipe(
        finalize(() => { 
          this.cdRef.detectChanges(); 
        })
      ).subscribe({
        next: (savedRecipe: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: `Recette ${this.isEditMode ? 'mise à jour' : 'créée'} avec succès!`
          });
          this.dialogRef.close(savedRecipe); 
        },
        error: (err: any) => {
          if (!(err instanceof Error && err.message.includes("L'URL de l'image"))) {
             console.error('Save/Update failed:', err);
             this.messageService.add({
               severity: 'error',
               summary: 'Erreur Sauvegarde',
               detail: `Échec de la ${this.isEditMode ? 'mise à jour' : 'création'} de la recette.`
             });
          }
        }
      })
    );
  }

  private saveOrUpdateRecipe(recipeData: any) {
    recipeData.ingredients = recipeData.ingredients.filter((ing: Ingredient) => ing.name?.trim());
    const recipeId = this.recipeToEdit?.id ?? recipeData.id; 

    if (this.isEditMode && recipeId) {
      return this.recipeService.updateRecipe(recipeData);
    } else {
      delete recipeData.id;
      delete recipeData._id;
      return this.recipeService.addRecipe(recipeData);
    }
  }

  closeDialog(): void {
    this.dialogRef.close(); 
  }

  get name(): AbstractControl { return this.recipeForm.get('name')!; }
  get category(): AbstractControl { return this.recipeForm.get('category')!; }
  get basePortionRatio() { return this.recipeForm.get('basePortionRatio'); }
  get imageUrl(): AbstractControl { return this.recipeForm.get('imageUrl')!; }
}